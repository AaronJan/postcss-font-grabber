/**
 * Define all regular expressions will be used.
 */

const extractUrlFromFontFaceSrcRegex          = /^url\s*\(\s*[\'\"]?(https?:[^\)]*?)[\'\"]?\s*\)/;
const validFontExtensionRegex                 = /\.(ttf|otf|woff|woff2|eot|svg)$/;
const trimRegex                               = /(^\s+|\s+$)/g;
const isFontFaceSrcContainsRemoteFontUrlRegex = /(\s*|,|^)url\s*\(\s*[\'\"]?https?:/;
const isRemoteFontUrlRegex                    = /^\s*url\s*\(\s*[\'\"]?https?:/;

export {
  extractUrlFromFontFaceSrcRegex,
  validFontExtensionRegex,
  trimRegex,
  isFontFaceSrcContainsRemoteFontUrlRegex,
  isRemoteFontUrlRegex,
};
