/**
 * Define all regular expressions will be used.
 */

const extractUrlFromFontFaceSrcRegex      = /^url\s*\(\s*(\"|\')(https?:[^\)]*?)(\"|\')\s*\)/;
const validFontExtensionRegex             = /\.(ttf|otf|woff|eot|svg)$/;
const trimRegex                           = /(^\s+|\s+$)/g;
const isFontFaceSrcContainsRemoteUrlRegex = /^\s*url\s*\(\s*(\'|\"https?:)/;

export {
  extractUrlFromFontFaceSrcRegex,
  validFontExtensionRegex,
  trimRegex,
  isFontFaceSrcContainsRemoteUrlRegex,
};
