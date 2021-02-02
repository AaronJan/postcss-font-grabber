import { Declaration } from 'postcss';
import path from 'path';
import url from 'url';
import { createWriteStream } from 'fs';

import { ParsedSrc, FontSpec, DownloadResult } from '../types';
import { md5, trim } from '../helpers';
import { debug } from 'console';
import { PostcssFontGrabberError } from './errors';

const FontExtensionsToMimeTypes = {
  woff: ['application/font-woff', 'font/woff'],
  woff2: ['application/font-woff2', 'font/woff2'],
  eot: ['application/vnd.ms-fontobject'],
  ttf: ['application/x-font-ttf', 'application/x-font-truetype'],
  otf: ['application/x-font-opentype', 'font/otf'],
  svg: ['image/svg+xml'],
};

const FontExtensionsToFormats: Record<string, string> = {
  eot: 'embedded-opentype',
  woff: 'woff',
  woff2: 'woff2',
  ttf: 'truetype',
  svg: 'svg',
};

export function isRemoteFontFaceDeclaration(node: Declaration): boolean {
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

export function isFontFaceSrcContainsRemoteFontUri(cssValue: string): boolean {
  return /(\s*|,|^)url\s*\(\s*[\'\"]?https?:/.test(cssValue);
}

export function getFontFilename(fontUriObject: url.UrlWithStringQuery): string {
  if (fontUriObject.pathname) {
    const baseName = path.basename(fontUriObject.pathname);

    if (baseName?.indexOf('.') !== -1) {
      return baseName;
    }
  }

  return md5(url.format(fontUriObject));
}

export function guessFormatFromUrl(
  urlObject: url.UrlWithStringQuery,
): string | undefined {
  if (!urlObject.pathname) {
    return;
  }
  const extension = path.extname(urlObject.pathname);

  return FontExtensionsToFormats[extension.substring(1)];
}

export function parseSrcString(src: string): undefined | ParsedSrc {
  const result = /^url\s*\(\s*[\'\"]?(https?:[^\)]*?)[\'\"]?\s*\)(\s+format\([\'\"]?([a-zA-Z0-9]+)[\'\"]?\))?/.exec(
    src,
  );
  if (result === null) {
    return undefined;
  }

  const urlObject = url.parse(result[1]);
  const format =
    result[3] !== undefined ? result[3] : guessFormatFromUrl(urlObject);
  if (format === undefined) {
    debug(`can't get the font format from @font-face src: [${src}]`);
  }

  return {
    urlObject,
    format,
  };
}

export function calculateFontId(fontUrl: url.UrlWithStringQuery) {
  return md5(url.format(fontUrl));
}

export function getSourceCssFilePath(node: Declaration): string {
  const sourceFile = node.source?.input?.file;
  if (sourceFile === undefined) {
    throw new PostcssFontGrabberError(
      `Can not get CSS file path of the node: "${node.toString()}"`,
    );
  }
  return sourceFile;
}

export function calculateFontSpecs(fontFaceNode: Declaration): FontSpec[] {
  const srcs = fontFaceNode.value.split(',').map(trim);
  const filteredAndParsedSrcs: ParsedSrc[] = srcs.reduce((parsedSrcs, src) => {
    const parsed = parseSrcString(src);
    return parsed ? [...parsedSrcs, parsed] : parsedSrcs;
  }, [] as ParsedSrc[]);

  return filteredAndParsedSrcs.map(parsedSrc => {
    return {
      id: calculateFontId(parsedSrc.urlObject),
      parsedSrc,
      basename: path.basename(parsedSrc.urlObject.pathname ?? ''),
      css: {
        sourceFile: getSourceCssFilePath(fontFaceNode),
      },
    };
  });
}

export function getFormatForFontExtension(extension: string): string | null {
  const format = FontExtensionsToFormats[extension];
  return format === undefined ? null : format;
}

export function getFontExtensionForFormat(format: string): string {
  const lowerCased = format.toLowerCase();
  for (const [extension, format] of Object.entries(FontExtensionsToFormats)) {
    if (format === lowerCased) {
      return extension;
    }
  }

  throw new PostcssFontGrabberError(
    `Invalid format: "${format}", please check your CSS rule.`,
  );
}

export function getFontFileExtentionForMimeType(
  mimeType: string,
): string | null {
  const lowerCased = mimeType.toLowerCase();
  for (const [extension, mimeTypes] of Object.entries(
    FontExtensionsToMimeTypes,
  )) {
    if (mimeTypes.includes(lowerCased)) {
      return extension;
    }
  }
  return null;
}

export function getExtensionForBasename(basename: string): string {
  return path.extname(basename).replace(/^\./, '');
}

export function getFontFileExtention({
  format,
  mimeType,
  basename,
}: {
  format?: string;
  mimeType?: string;
  basename: string;
}): string {
  if (format) {
    return getFontExtensionForFormat(format);
  }

  if (mimeType) {
    const mimeTypeExtension = getFontFileExtentionForMimeType(mimeType);
    if (mimeTypeExtension !== null) {
      return mimeTypeExtension;
    }
  }

  return getExtensionForBasename(basename);
}

export function saveFile({
  downloadResult,
  fontSpec,
  fontDirectoryPath,
}: {
  downloadResult: DownloadResult;
  fontSpec: FontSpec;
  fontDirectoryPath: string;
}): Promise<{
  filename: string;
  filePath: string;
  format: string | null;
}> {
  const extension = getFontFileExtention({
    format: fontSpec.parsedSrc.format,
    mimeType: downloadResult.mimeType,
    basename: fontSpec.basename,
  });
  const finalFormat =
    fontSpec.parsedSrc.format ?? getFormatForFontExtension(extension);
  // Generate a new filename
  const filename = `${fontSpec.id}${extension === '' ? '' : `.${extension}`}`;
  const filePath = path.join(fontDirectoryPath, filename);

  return new Promise((resolve, reject) => {
    const file = createWriteStream(filePath);
    file.on('error', error => reject(error));
    file.on('finish', () =>
      resolve({
        filename,
        filePath,
        format: finalFormat,
      }),
    );

    downloadResult.data.pipe(file);
  });
}

export function calculateRelativePath({
  cssDirectoryPath,
  cssFileDirectoryRelativePath,
  fontFilePath,
}: {
  cssDirectoryPath: string;
  cssFileDirectoryRelativePath: string;
  fontFilePath: string;
}): string {
  const filename = path.basename(fontFilePath);
  const fontDirectoryPath = path.dirname(fontFilePath);
  const cssFilePath = path.join(cssDirectoryPath, cssFileDirectoryRelativePath);

  return path.join(path.relative(cssFilePath, fontDirectoryPath), filename);
}

export function getNewDeclarationValue({
  value,
  oldUrl,
  newUrl,
}: {
  value: string;
  oldUrl: string;
  newUrl: string;
}): string {
  return value.replace(oldUrl, newUrl);
}

export function getSubDirectoryPath(
  directoryPath: string,
  subFilePath: string,
): string {
  const relativeFilePath = path.relative(directoryPath, subFilePath);
  return path.dirname(relativeFilePath);
}
