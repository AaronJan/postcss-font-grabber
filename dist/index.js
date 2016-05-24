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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFRQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQU1BLElBQU0sU0FBUyxrQkFBUSxNQUFSLENBQWUsc0JBQWYsRUFBdUMsVUFBQyxJQUFELEVBQVU7QUFDOUQsU0FBTyxzQkFBWSxpQkFBWixDQUE4QixJQUE5QixDQUFQO0FBQ0QsQ0FGYyxDQUFmOzs7OztrQkFPZSxNIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFBvc3Rjc3MgRm9udCBHcmFiYmVyXHJcbiAqXHJcbiAqIEBsaWNlbnNlICAgICAgICBBcGFjaGUgMi4wXHJcbiAqIEBjb3B5cmlnaHQgIChjKSAyMDE2LCBBYXJvbkphblxyXG4gKiBAYXV0aG9yICAgICAgICAgQWFyb25KYW4gPGh0dHBzOi8vZ2l0aHViLmNvbS9BYXJvbkphbi9wb3N0Y3NzLWZvbnQtZ3JhYmJlcj5cclxuICovXHJcblxyXG5pbXBvcnQgcG9zdGNzcyBmcm9tICdwb3N0Y3NzJztcclxuaW1wb3J0IEZvbnRHcmFiYmVyIGZyb20gJy4vbGliL2ZvbnQtZ3JhYmJlcic7XHJcblxyXG5cclxuLy9cclxuLy8gTWFrZSBwbHVnaW4gaW5zdGFuY2UuXHJcbi8vXHJcbmNvbnN0IHBsdWdpbiA9IHBvc3Rjc3MucGx1Z2luKCdwb3N0Y3NzLWZvbnQtZ3JhYmJlcicsIChvcHRzKSA9PiB7XHJcbiAgcmV0dXJuIEZvbnRHcmFiYmVyLm1ha2VQbHVnaW5IYW5kbGVyKG9wdHMpO1xyXG59KTtcclxuXHJcbi8vXHJcbi8vIEV4cG9zZS5cclxuLy9cclxuZXhwb3J0IGRlZmF1bHQgcGx1Z2luO1xyXG4iXX0=