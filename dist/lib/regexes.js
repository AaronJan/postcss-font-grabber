"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Define all regular expressions will be used.
 */

var extractUrlFromFontFaceSrcRegex = /^url\s*\(\s*[\'\"]?(https?:[^\)]*?)[\'\"]?\s*\)/;
var validFontExtensionRegex = /\.(ttf|otf|woff|eot|svg)$/;
var trimRegex = /(^\s+|\s+$)/g;
var isFontFaceSrcContainsRemoteFontUrlRegex = /(\s*|,|^)url\s*\(\s*[\'\"]?https?:/;
var isRemoteFontUrlRegex = /^\s*url\s*\(\s*[\'\"]?https?:/;

exports.extractUrlFromFontFaceSrcRegex = extractUrlFromFontFaceSrcRegex;
exports.validFontExtensionRegex = validFontExtensionRegex;
exports.trimRegex = trimRegex;
exports.isFontFaceSrcContainsRemoteFontUrlRegex = isFontFaceSrcContainsRemoteFontUrlRegex;
exports.isRemoteFontUrlRegex = isRemoteFontUrlRegex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvcmVnZXhlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFJQSxJQUFNLGlDQUEwQyxpREFBaEQ7QUFDQSxJQUFNLDBCQUEwQywyQkFBaEQ7QUFDQSxJQUFNLFlBQTBDLGNBQWhEO0FBQ0EsSUFBTSwwQ0FBMEMsb0NBQWhEO0FBQ0EsSUFBTSx1QkFBMEMsK0JBQWhEOztRQUdFLDhCLEdBQUEsOEI7UUFDQSx1QixHQUFBLHVCO1FBQ0EsUyxHQUFBLFM7UUFDQSx1QyxHQUFBLHVDO1FBQ0Esb0IsR0FBQSxvQiIsImZpbGUiOiJyZWdleGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBEZWZpbmUgYWxsIHJlZ3VsYXIgZXhwcmVzc2lvbnMgd2lsbCBiZSB1c2VkLlxuICovXG5cbmNvbnN0IGV4dHJhY3RVcmxGcm9tRm9udEZhY2VTcmNSZWdleCAgICAgICAgICA9IC9edXJsXFxzKlxcKFxccypbXFwnXFxcIl0/KGh0dHBzPzpbXlxcKV0qPylbXFwnXFxcIl0/XFxzKlxcKS87XG5jb25zdCB2YWxpZEZvbnRFeHRlbnNpb25SZWdleCAgICAgICAgICAgICAgICAgPSAvXFwuKHR0ZnxvdGZ8d29mZnxlb3R8c3ZnKSQvO1xuY29uc3QgdHJpbVJlZ2V4ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gLyheXFxzK3xcXHMrJCkvZztcbmNvbnN0IGlzRm9udEZhY2VTcmNDb250YWluc1JlbW90ZUZvbnRVcmxSZWdleCA9IC8oXFxzKnwsfF4pdXJsXFxzKlxcKFxccypbXFwnXFxcIl0/aHR0cHM/Oi87XG5jb25zdCBpc1JlbW90ZUZvbnRVcmxSZWdleCAgICAgICAgICAgICAgICAgICAgPSAvXlxccyp1cmxcXHMqXFwoXFxzKltcXCdcXFwiXT9odHRwcz86LztcblxuZXhwb3J0IHtcbiAgZXh0cmFjdFVybEZyb21Gb250RmFjZVNyY1JlZ2V4LFxuICB2YWxpZEZvbnRFeHRlbnNpb25SZWdleCxcbiAgdHJpbVJlZ2V4LFxuICBpc0ZvbnRGYWNlU3JjQ29udGFpbnNSZW1vdGVGb250VXJsUmVnZXgsXG4gIGlzUmVtb3RlRm9udFVybFJlZ2V4LFxufTtcbiJdfQ==