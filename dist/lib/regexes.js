"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Define all regular expressions will be used.
 */

var extractUrlFromFontFaceSrcRegex = /^url\s*\(\s*[\'\"]?(https?:[^\)]*?)[\'\"]?\s*\)/;
var validFontExtensionRegex = /\.(ttf|otf|woff|woff2|eot|svg)$/;
var trimRegex = /(^\s+|\s+$)/g;
var isFontFaceSrcContainsRemoteFontUrlRegex = /(\s*|,|^)url\s*\(\s*[\'\"]?https?:/;
var isRemoteFontUrlRegex = /^\s*url\s*\(\s*[\'\"]?https?:/;

exports.extractUrlFromFontFaceSrcRegex = extractUrlFromFontFaceSrcRegex;
exports.validFontExtensionRegex = validFontExtensionRegex;
exports.trimRegex = trimRegex;
exports.isFontFaceSrcContainsRemoteFontUrlRegex = isFontFaceSrcContainsRemoteFontUrlRegex;
exports.isRemoteFontUrlRegex = isRemoteFontUrlRegex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvcmVnZXhlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBOzs7O0FBSUEsSUFBTSxpQ0FBMEMsaURBQWhEO0FBQ0EsSUFBTSwwQkFBMEMsaUNBQWhEO0FBQ0EsSUFBTSxZQUEwQyxjQUFoRDtBQUNBLElBQU0sMENBQTBDLG9DQUFoRDtBQUNBLElBQU0sdUJBQTBDLCtCQUFoRDs7UUFHRSw4QixHQUFBLDhCO1FBQ0EsdUIsR0FBQSx1QjtRQUNBLFMsR0FBQSxTO1FBQ0EsdUMsR0FBQSx1QztRQUNBLG9CLEdBQUEsb0IiLCJmaWxlIjoicmVnZXhlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRGVmaW5lIGFsbCByZWd1bGFyIGV4cHJlc3Npb25zIHdpbGwgYmUgdXNlZC5cbiAqL1xuXG5jb25zdCBleHRyYWN0VXJsRnJvbUZvbnRGYWNlU3JjUmVnZXggICAgICAgICAgPSAvXnVybFxccypcXChcXHMqW1xcJ1xcXCJdPyhodHRwcz86W15cXCldKj8pW1xcJ1xcXCJdP1xccypcXCkvO1xuY29uc3QgdmFsaWRGb250RXh0ZW5zaW9uUmVnZXggICAgICAgICAgICAgICAgID0gL1xcLih0dGZ8b3RmfHdvZmZ8d29mZjJ8ZW90fHN2ZykkLztcbmNvbnN0IHRyaW1SZWdleCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IC8oXlxccyt8XFxzKyQpL2c7XG5jb25zdCBpc0ZvbnRGYWNlU3JjQ29udGFpbnNSZW1vdGVGb250VXJsUmVnZXggPSAvKFxccyp8LHxeKXVybFxccypcXChcXHMqW1xcJ1xcXCJdP2h0dHBzPzovO1xuY29uc3QgaXNSZW1vdGVGb250VXJsUmVnZXggICAgICAgICAgICAgICAgICAgID0gL15cXHMqdXJsXFxzKlxcKFxccypbXFwnXFxcIl0/aHR0cHM/Oi87XG5cbmV4cG9ydCB7XG4gIGV4dHJhY3RVcmxGcm9tRm9udEZhY2VTcmNSZWdleCxcbiAgdmFsaWRGb250RXh0ZW5zaW9uUmVnZXgsXG4gIHRyaW1SZWdleCxcbiAgaXNGb250RmFjZVNyY0NvbnRhaW5zUmVtb3RlRm9udFVybFJlZ2V4LFxuICBpc1JlbW90ZUZvbnRVcmxSZWdleCxcbn07XG4iXX0=