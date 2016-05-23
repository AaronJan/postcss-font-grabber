"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Define all regular expressions will be used.
 */

var extractUrlFromFontFaceSrcRegex = /^url\s*\(\s*(\"|\')(https?:[^\)]*?)(\"|\')\s*\)/;
var validFontExtensionRegex = /\.(ttf|otf|woff|eot|svg)$/;
var trimRegex = /(^\s+|\s+$)/g;
var isFontFaceSrcContainsRemoteUrlRegex = /^\s*url\s*\(\s*(\'|\"https?:)/;

exports.extractUrlFromFontFaceSrcRegex = extractUrlFromFontFaceSrcRegex;
exports.validFontExtensionRegex = validFontExtensionRegex;
exports.trimRegex = trimRegex;
exports.isFontFaceSrcContainsRemoteUrlRegex = isFontFaceSrcContainsRemoteUrlRegex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvcmVnZXhlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFJQSxJQUFNLGlDQUFzQyxpREFBNUM7QUFDQSxJQUFNLDBCQUFzQywyQkFBNUM7QUFDQSxJQUFNLFlBQXNDLGNBQTVDO0FBQ0EsSUFBTSxzQ0FBc0MsK0JBQTVDOztRQUdFLDhCLEdBQUEsOEI7UUFDQSx1QixHQUFBLHVCO1FBQ0EsUyxHQUFBLFM7UUFDQSxtQyxHQUFBLG1DIiwiZmlsZSI6InJlZ2V4ZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERlZmluZSBhbGwgcmVndWxhciBleHByZXNzaW9ucyB3aWxsIGJlIHVzZWQuXG4gKi9cblxuY29uc3QgZXh0cmFjdFVybEZyb21Gb250RmFjZVNyY1JlZ2V4ICAgICAgPSAvXnVybFxccypcXChcXHMqKFxcXCJ8XFwnKShodHRwcz86W15cXCldKj8pKFxcXCJ8XFwnKVxccypcXCkvO1xuY29uc3QgdmFsaWRGb250RXh0ZW5zaW9uUmVnZXggICAgICAgICAgICAgPSAvXFwuKHR0ZnxvdGZ8d29mZnxlb3R8c3ZnKSQvO1xuY29uc3QgdHJpbVJlZ2V4ICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAvKF5cXHMrfFxccyskKS9nO1xuY29uc3QgaXNGb250RmFjZVNyY0NvbnRhaW5zUmVtb3RlVXJsUmVnZXggPSAvXlxccyp1cmxcXHMqXFwoXFxzKihcXCd8XFxcImh0dHBzPzopLztcblxuZXhwb3J0IHtcbiAgZXh0cmFjdFVybEZyb21Gb250RmFjZVNyY1JlZ2V4LFxuICB2YWxpZEZvbnRFeHRlbnNpb25SZWdleCxcbiAgdHJpbVJlZ2V4LFxuICBpc0ZvbnRGYWNlU3JjQ29udGFpbnNSZW1vdGVVcmxSZWdleCxcbn07XG4iXX0=