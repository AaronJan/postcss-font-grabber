import postcss from 'postcss';
import path from 'path';
import url from 'url';

import { PluginOptions, PluginSettings, RemoteFont, Job, JobResult, Dictionary } from '../contracts';
import { defaultValue, md5, trim } from '../helpers';
import { Downloader as DownloaderContract } from './downloader/contract';
import { Downloader } from './downloader';
import sanitize from 'sanitize-filename';

const fontExtensionToFormatMap: Dictionary<string> = {
    '.eot': 'embedded-opentype',
    '.woff': 'woff',
    '.woff2': 'woff2',
    '.ttf': 'truetype',
    '.svg': 'svg',
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
        filePattern: options.filePattern ?? '[name][ext]',
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
export function getFontFilename(
    fontUriObject: url.UrlWithStringQuery,
    filePattern: string
): string {
    const pathname = fontUriObject.pathname;

    if (!pathname) {
        return md5(url.format(fontUriObject));
    }

    return filePattern
        .replace(/\[path\]/gi, () => sanitize(pathname))
        .replace(/\[query\]/gi, () => sanitize(fontUriObject.query ?? ''))
        .replace(/\[name\]/gi, () => path.basename(pathname)
            .slice(0, -path.extname(pathname).length))
        .replace(/\[ext\]/gi, () => path.extname(pathname))
        .replace(/\[hash\]/gi, () => md5(url.format(fontUriObject)));
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
    downloadDirectoryPath: string,
    filePattern: string
): Job[] {
    const relativePath = path.relative(
        cssDestinationDirectoryPath,
        downloadDirectoryPath
    );

    const fontFaceSrcs = declaration.value.split(',').map(trim);
    const fontInfos: RemoteFont[] = fontFaceSrcs.reduce(reduceSrcsToFontInfos, []);

    return fontInfos.map<Job>(fontInfo => {
        const filename = getFontFilename(fontInfo.urlObject, filePattern);
        const filePath = path.resolve(path.join(downloadDirectoryPath, filename));

        const job: Job = {
            remoteFont: fontInfo,
            css: {
                sourcePath: cssSourceFilePath,
                destinationDirectoryPath: cssDestinationDirectoryPath,
            },
            font: {
                path: filePath,
                filename: filename,
            },
        };

        const originalUri = url.format(fontInfo.urlObject);
        const replaceTo = path.join(relativePath, job.font.filename)
            // Replace `\\` to `/` for Windows compatibility.
            .replace(/\\/g, '/');

        declaration.value = declaration.value.replace(originalUri, replaceTo);

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
        job.font.path
    )
        .then(fileInfo => {
            return {
                job,
                download: {
                    size: fileInfo.size,
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
