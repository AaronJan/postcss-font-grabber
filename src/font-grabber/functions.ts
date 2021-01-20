import postcss from 'postcss';
import path from 'path';
import url from 'url';

import { PluginOptions, PluginSettings, RemoteFont, Job, JobResult, Dictionary } from '../contracts';
import { defaultValue, md5, trim } from '../helpers';
import { Downloader as DownloaderContract } from './downloader/contract';
import { Downloader } from './downloader';

const fontExtensionToFormatMap: Dictionary<string> = {
    '.eot': 'embedded-opentype',
    '.woff': 'woff',
    '.woff2': 'woff2',
    '.ttf': 'truetype',
    '.svg': 'svg',
};

const fontFormatToExtensionMap: Dictionary<string> = {
    'font/embedded-opentype': '.eot',
    'font/woff': '.woff',
    'font/woff2': '.woff2',
    'font/truetype': '.ttf',
    'font/svg': '.svg',
};

/**
 * 
 * @param unvalidatedOptions 
 */
export function parseOptions(options: PluginOptions): PluginSettings {
    return <PluginSettings>{
        cssSourceDirectoryPath: options.cssSrc !== undefined ? path.resolve(options.cssSrc) : undefined,
        cssDestinationDirectoryPath: options.cssDest !== undefined ? path.resolve(options.cssDest) : undefined,
        fontDirectoryPath: options.fontDir !== undefined ? path.resolve(options.fontDir) : undefined,
        autoCreateDirectory: defaultValue(options.mkdir, true),
    };
}

/**
 * 
 * @param {postcss.ChildNode} node
 * @returns {boolean}
 */
export function isRemoteFontFaceDeclaration(node: postcss.ChildNode): boolean {
    if (node.type !== 'decl') {
        return false;
    }
    if (node.prop !== 'src') {
        return false;
    }
    if (isFontFaceSrcContainsRemoteFontUri(node.value) === false) {
        return false;
    }

    return true;
}

/**
 * 
 * @param cssValue 
 * @returns {boolean}
 */
export function isFontFaceSrcContainsRemoteFontUri(cssValue: string): boolean {
    return /(\s*|,|^)url\s*\(\s*[\'\"]?https?:/.test(cssValue);
}

/**
 * @param fontUriObject 
 */
export function getFontFilename(fontUriObject: url.UrlWithStringQuery, contentType: string | undefined): string {
    if (fontUriObject.pathname) {
        const baseName = path.basename(fontUriObject.pathname);

        if (baseName?.indexOf('.') !== -1) {
            return baseName;
        }
    }

    const extension = contentType === undefined
        ? ''
        : fontFormatToExtensionMap[contentType] ?? '';

    return `${md5(url.format(fontUriObject))}${extension}`;
}

/**
 * 
 * @param urlObject 
 */
export function getFontFormatFromUrlObject(urlObject: url.UrlWithStringQuery): undefined | string {
    if (!urlObject.pathname) {
        return;
    }

    const extension = path.extname(urlObject.pathname);

    return fontExtensionToFormatMap[extension] !== undefined ?
        fontExtensionToFormatMap[extension] :
        undefined;
}

/**
 * 
 * @param src 
 */
export function getFontInfoFromSrc(src: string): undefined | RemoteFont {
    const result = /^url\s*\(\s*[\'\"]?(https?:[^\)]*?)[\'\"]?\s*\)(\s+format\([\'\"]?([a-zA-Z0-9]+)[\'\"]?\))?/.exec(src);
    if (result === null) {
        return undefined;
    }

    const urlObject = url.parse(result[1]);
    const format = result[3] !== undefined ? result[3] : getFontFormatFromUrlObject(urlObject);
    if (format === undefined) {
        throw new Error(`can't get the font format from @font-face src: [${src}]`);
    }

    return {
        urlObject,
        format,
    };
}

/**
 * 
 * @param fontInfos 
 * @param src 
 */
export function reduceSrcsToFontInfos(fontInfos: RemoteFont[], src: string): RemoteFont[] {
    const fontInfo = getFontInfoFromSrc(src);

    return fontInfo === undefined ?
        fontInfos :
        [...fontInfos, fontInfo];
}

/**
 * 
 * @param declaration 
 * @param cssSourceFilePath 
 * @param cssDestinationDirectoryPath
 * @param downloadDirectoryPath 
 */
export function processDeclaration(
    declaration: postcss.Declaration,
    cssSourceFilePath: string,
    cssDestinationDirectoryPath: string,
    downloadDirectoryPath: string
): Job[] {
    const relativePath = path.relative(
        cssDestinationDirectoryPath,
        downloadDirectoryPath
    );

    const fontDirectoryPath = path.resolve(downloadDirectoryPath);

    const fontFaceSrcs = declaration.value.split(',').map(trim);
    const fontInfos: RemoteFont[] = fontFaceSrcs.reduce(reduceSrcsToFontInfos, []);

    return fontInfos.map<Job>(fontInfo => {
        const job: Job = {
            declaration,
            remoteFont: fontInfo,
            css: {
                sourcePath: cssSourceFilePath,
                destinationDirectoryPath: cssDestinationDirectoryPath,
            },
            font: {
                destinationDirectoryPath: fontDirectoryPath,
                destinationRelativePath: relativePath,
            },
        };

        return job;
    });
}

/**
 * 
 * @param job 
 * @param downloader 
 */
export function downloadFont(
    job: Job,
    downloader: DownloaderContract = new Downloader()
): Promise<JobResult> {
    return downloader.download(
        job.remoteFont.urlObject,
        job.font.destinationDirectoryPath
    )
        .then(fileInfo => {
            return {
                job,
                download: {
                    size: fileInfo.size,
                    fileName: fileInfo.fileName,
                    path: fileInfo.filePath,
                },
            };
        });
}

/**
 * 
 * @param cssSourceFilePath 
 * @param cssSourceDirectoryPathFromSetting 
 * @param cssDestinationDirectoryPathFromSetting 
 * @param postcssOptionsTo 
 */
export function calculateCssOutputDirectoryPath(
    cssSourceFilePath: string,
    cssSourceDirectoryPathFromSetting: string | undefined,
    cssDestinationDirectoryPathFromSetting: string | undefined,
    postcssOptionsTo: string | undefined
): string | undefined {
    const cssDirectoryPath = path.dirname(cssSourceFilePath);
    const finalPostcssOptionsTo = defaultValue(postcssOptionsTo, undefined);
    // Get the sub-folder stucture.
    const cssSourceDirectoryPath = defaultValue(
        cssSourceDirectoryPathFromSetting,
        cssDirectoryPath
    );
    const cssDestinationDirectoryPath = defaultValue(
        cssDestinationDirectoryPathFromSetting,
        (finalPostcssOptionsTo !== undefined ? path.dirname(finalPostcssOptionsTo) : undefined)
    );

    if (cssDestinationDirectoryPath === undefined) {
        return undefined;
    }

    const cssToSourceDirectoryRelation = path.relative(cssSourceDirectoryPath, cssDirectoryPath);

    return path.join(cssDestinationDirectoryPath, cssToSourceDirectoryRelation);
}
