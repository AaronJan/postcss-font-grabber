'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _fontGrabber = require('./lib/font-grabber');

var _fontGrabber2 = _interopRequireDefault(_fontGrabber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//
// Make plugin instance.
//
/**
 * Postcss Font Grabber
 *
 * @license        Apache 2.0
 * @copyright  (c) 2016, AaronJan
 * @author         AaronJan <https://github.com/AaronJan/postcss-font-grabber>
 */

var plugin = _postcss2.default.plugin('postcss-font-grabber', function (opts) {
  return _fontGrabber2.default.makePluginHandler(opts);
});

//
// Expose.
//
exports.default = plugin;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFRQTs7OztBQUNBOzs7Ozs7QUFHQTtBQUNBO0FBQ0E7QUFkQTs7Ozs7Ozs7QUFlQSxJQUFNLFNBQVMsa0JBQVEsTUFBUixDQUFlLHNCQUFmLEVBQXVDLFVBQUMsSUFBRCxFQUFVO0FBQzlELFNBQU8sc0JBQVksaUJBQVosQ0FBOEIsSUFBOUIsQ0FBUDtBQUNELENBRmMsQ0FBZjs7QUFJQTtBQUNBO0FBQ0E7a0JBQ2UsTSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBQb3N0Y3NzIEZvbnQgR3JhYmJlclxyXG4gKlxyXG4gKiBAbGljZW5zZSAgICAgICAgQXBhY2hlIDIuMFxyXG4gKiBAY29weXJpZ2h0ICAoYykgMjAxNiwgQWFyb25KYW5cclxuICogQGF1dGhvciAgICAgICAgIEFhcm9uSmFuIDxodHRwczovL2dpdGh1Yi5jb20vQWFyb25KYW4vcG9zdGNzcy1mb250LWdyYWJiZXI+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHBvc3Rjc3MgZnJvbSAncG9zdGNzcyc7XHJcbmltcG9ydCBGb250R3JhYmJlciBmcm9tICcuL2xpYi9mb250LWdyYWJiZXInO1xyXG5cclxuXHJcbi8vXHJcbi8vIE1ha2UgcGx1Z2luIGluc3RhbmNlLlxyXG4vL1xyXG5jb25zdCBwbHVnaW4gPSBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy1mb250LWdyYWJiZXInLCAob3B0cykgPT4ge1xyXG4gIHJldHVybiBGb250R3JhYmJlci5tYWtlUGx1Z2luSGFuZGxlcihvcHRzKTtcclxufSk7XHJcblxyXG4vL1xyXG4vLyBFeHBvc2UuXHJcbi8vXHJcbmV4cG9ydCBkZWZhdWx0IHBsdWdpbjtcclxuIl19