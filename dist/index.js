'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FontGrabber = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Postcss Font Grabber
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license        Apache 2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @copyright  (c) 2016, AaronJan
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author         AaronJan <https://github.com/AaronJan/postcss-font-grabber>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _downloader = require('./lib/downloader');

var _downloader2 = _interopRequireDefault(_downloader);

var _regexes = require('./lib/regexes');

var regexes = _interopRequireWildcard(_regexes);

var _includes = require('lodash/fp/includes');

var _includes2 = _interopRequireDefault(_includes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 */

var FontGrabber = function () {
  function FontGrabber() {
    _classCallCheck(this, FontGrabber);
  }

  _createClass(FontGrabber, null, [{
    key: 'validatePostcssOptions',


    /**
     *
     * @param postcssOpts
     */
    value: function validatePostcssOptions(postcssOpts) {
      if (!postcssOpts.from) {
        throw new Error('postcss-font-grabber requires postcss "from" option.');
      }
      if (!postcssOpts.to || postcssOpts.to === postcssOpts.from) {
        throw new Error('postcss-font-grabber requires postcss "to" option.');
      }
    }

    /**
     *
     * @param iterator
     * @returns {function()}
     */

    /**
     *
     */

  }, {
    key: 'iterateCSSRuleWith',
    value: function iterateCSSRuleWith(iterator) {
      return function (rule) {
        rule.each(iterator);
      };
    }

    /**
     *
     * @param src
     * @returns {*}
     */

  }, {
    key: 'generateUrlObjectFromSrc',
    value: function generateUrlObjectFromSrc(src) {
      var result = regexes.extractUrlFromFontFaceSrcRegex.exec(src);

      return result === null ? null : _url2.default.parse(result[2]);
    }

    /**
     *
     * @param kept
     * @param value
     * @returns {*}
     */

  }, {
    key: 'keepUniqueAndValidFontFileUrlObject',
    value: function keepUniqueAndValidFontFileUrlObject(kept, value) {
      if (value && regexes.validFontExtensionRegex.test(value.pathname) && !(0, _includes2.default)(kept, value)) {
        kept.push(value);
      }

      return kept;
    }

    /**
     *
     * @param downloadDir
     * @returns {function()}
     */

  }, {
    key: 'makeFontDownloadJobDispatcher',
    value: function makeFontDownloadJobDispatcher(downloadDir) {
      return function (fontUrlObj) {
        var filename = fontUrlObj.pathname.split('/').pop();

        return {
          url: fontUrlObj.href,
          filename: filename,
          promise: FontGrabber.downloader.download(fontUrlObj, _path2.default.join(downloadDir, filename))
        };
      };
    }

    /**
     *
     * @param opts
     * @param postcssOpts
     */

  }, {
    key: 'reviewOptions',
    value: function reviewOptions(opts, postcssOpts) {
      if (!opts.base) {
        opts.base = _path2.default.dirname(postcssOpts.to);
      }
    }

    /**
     * Skip Font-Face Postcss object that is:
     *   not a Declaration
     *   or doesn't contain `src` property
     *   or doesn't contain remote font file
     *
     * @param decl
     * @returns {boolean}
     */

  }, {
    key: 'shouldProcessThisFontFaceDeclaration',
    value: function shouldProcessThisFontFaceDeclaration(decl) {
      if (decl.type !== 'decl') {
        return false;
      } else if (decl.prop !== 'src') {
        return false;
      } else if (regexes.isFontFaceSrcContainsRemoteUrlRegex.test(decl.value) === false) {
        return false;
      }

      return true;
    }

    /**
     * Download font file and update output CSS rule correspondingly.
     *
     * @param decl Postcss Declaration object.
     * @param saveDirPath
     * @param cssFilePath
     * @returns {Promise}
     */

  }, {
    key: 'downloadFontAndUpdateDeclaration',
    value: function downloadFontAndUpdateDeclaration(decl, saveDirPath, cssFilePath) {
      //
      // One src could have multiple `url()`, they are separated with `,`.
      //
      var srcUrls = decl.value.split(',').map(function (value) {
        return value.replace(regexes.trimRegex, '');
      });

      //
      // Use `srcUrls` to generate Url objects for download.
      // This will check the validation of font url, and only keep which is
      // unique.
      var fontFileUrlObjects = srcUrls.map(FontGrabber.generateUrlObjectFromSrc).reduce(FontGrabber.keepUniqueAndValidFontFileUrlObject, []);

      //
      // If there is no font file needs to be download, end this function
      // Must return a promise.
      //
      if (fontFileUrlObjects.length === 0) {
        return Promise.resolve();
      }

      //
      // Download font to `saveDirPath` using Url objects **concurrently**
      // and return `job` objects that contain:
      //
      //   url: the full url needs to be replaced
      //   filename: the name of the saved file
      //   promise: a promise will be fulfilled when download completed
      //
      var jobs = fontFileUrlObjects.map(FontGrabber.makeFontDownloadJobDispatcher(saveDirPath));

      return Promise.all(jobs.map(function (job) {
        return job.promise;
      })).then(function () {
        //
        // The font file might be saved in a different directory to the CSS
        // file,  before replace the CSS rule, we have to derive the relative
        // path between them.
        //
        var relativePath = _path2.default.relative(_path2.default.dirname(cssFilePath), saveDirPath);

        //
        // Replace CSS rule with every font that downloaded.
        //
        jobs.map(function (job) {
          decl.value = decl.value.replace(job.url, _path2.default.join(relativePath, job.filename));
        });
      });
    }

    /**
     *
     * @param downloader
     */

  }, {
    key: 'setDownloader',
    value: function setDownloader(downloader) {
      FontGrabber.downloader = downloader;
    }

    /**
     *
     * @returns {Downloader}
     */

  }, {
    key: 'getDownloader',
    value: function getDownloader() {
      return FontGrabber.downloader;
    }

    /**
     * Make handle function for plugin to call with.
     *
     * @param opts
     * @returns {Function}
     */

  }, {
    key: 'makePluginHandler',
    value: function makePluginHandler() {
      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return function (css, result) {
        //
        // Get the options from Postcss for later use.
        //
        var postcssOpts = result.opts;

        //
        // If something is missing in the Postcss options, throw an Error.
        //
        FontGrabber.validatePostcssOptions(postcssOpts);

        //
        // Review options for Font Grabber (This may modify them).
        //
        FontGrabber.reviewOptions(opts, postcssOpts);

        //
        // Process every Declaration that matchs rule `font-face` concurrently.
        //
        var processPromises = [];

        var declarationProcessor = function declarationProcessor(decl) {
          if (FontGrabber.shouldProcessThisFontFaceDeclaration(decl)) {
            processPromises.push(FontGrabber.downloadFontAndUpdateDeclaration(decl, opts.base, postcssOpts.to));
          }
        };

        css.walkAtRules(/font-face/, FontGrabber.iterateCSSRuleWith(declarationProcessor));

        return processPromises.length === 0 ? Promise.resolve() : Promise.all(processPromises);
      };
    }
  }]);

  return FontGrabber;
}();

//
// Expose default method.
//


FontGrabber.downloader = new _downloader2.default();
exports.default = _postcss2.default.plugin('postcss-font-grabber', function (opts) {
  return FontGrabber.makePluginHandler(opts);
});

//
// Expose FontGrabber class for testing use.
//

exports.FontGrabber = FontGrabber;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFRQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJQUFZLE87O0FBQ1o7Ozs7Ozs7Ozs7Ozs7O0lBS00sVzs7Ozs7Ozs7Ozs7OzsyQ0FVMkIsVyxFQUFhO0FBQzFDLFVBQUksQ0FBRSxZQUFZLElBQWxCLEVBQXdCO0FBQ3RCLGNBQU0sSUFBSSxLQUFKLENBQVUsc0RBQVYsQ0FBTjtBQUNEO0FBQ0QsVUFBSSxDQUFFLFlBQVksRUFBZCxJQUFvQixZQUFZLEVBQVosS0FBbUIsWUFBWSxJQUF2RCxFQUE2RDtBQUMzRCxjQUFNLElBQUksS0FBSixDQUFVLG9EQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7Ozs7Ozs7Ozt1Q0FPMEIsUSxFQUFVO0FBQ25DLGFBQU8sVUFBQyxJQUFELEVBQVU7QUFDZixhQUFLLElBQUwsQ0FBVSxRQUFWO0FBQ0QsT0FGRDtBQUdEOzs7Ozs7Ozs7OzZDQU9nQyxHLEVBQUs7QUFDcEMsVUFBTSxTQUFTLFFBQVEsOEJBQVIsQ0FBdUMsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBZjs7QUFFQSxhQUNFLFdBQVcsSUFBWCxHQUNBLElBREEsR0FFQSxjQUFJLEtBQUosQ0FBVSxPQUFPLENBQVAsQ0FBVixDQUhGO0FBS0Q7Ozs7Ozs7Ozs7O3dEQVEyQyxJLEVBQU0sSyxFQUFPO0FBQ3ZELFVBQ0UsU0FDQSxRQUFRLHVCQUFSLENBQWdDLElBQWhDLENBQXFDLE1BQU0sUUFBM0MsQ0FEQSxJQUVDLENBQUUsd0JBQVMsSUFBVCxFQUFlLEtBQWYsQ0FITCxFQUlFO0FBQ0EsYUFBSyxJQUFMLENBQVUsS0FBVjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7O2tEQU9xQyxXLEVBQWE7QUFDakQsYUFBTyxVQUFDLFVBQUQsRUFBZ0I7QUFDckIsWUFBTSxXQUFXLFdBQVcsUUFBWCxDQUFvQixLQUFwQixDQUEwQixHQUExQixFQUEr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WUFBWSxFQUExRSxDQURGO0FBR0Q7QUFDRixTQU5EOztBQVFBLFlBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QixZQUFZLGtCQUFaLENBQStCLG9CQUEvQixDQUE3Qjs7QUFFQSxlQUNFLGdCQUFnQixNQUFoQixLQUEyQixDQUEzQixHQUNBLFFBQVEsT0FBUixFQURBLEdBRUEsUUFBUSxHQUFSLENBQVksZUFBWixDQUhGO0FBS0QsT0FwQ0Q7QUFxQ0Q7Ozs7Ozs7Ozs7O0FBblBHLFcsQ0FJRyxVLEdBQWEsMEI7a0JBc1BQLGtCQUFRLE1BQVIsQ0FBZSxzQkFBZixFQUF1QyxVQUFDLElBQUQsRUFBVTtBQUM5RCxTQUFPLFlBQVksaUJBQVosQ0FBOEIsSUFBOUIsQ0FBUDtBQUNELENBRmMsQzs7Ozs7O1FBT04sVyxHQUFBLFciLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogUG9zdGNzcyBGb250IEdyYWJiZXJcclxuICpcclxuICogQGxpY2Vuc2UgICAgICAgIEFwYWNoZSAyLjBcclxuICogQGNvcHlyaWdodCAgKGMpIDIwMTYsIEFhcm9uSmFuXHJcbiAqIEBhdXRob3IgICAgICAgICBBYXJvbkphbiA8aHR0cHM6Ly9naXRodWIuY29tL0Fhcm9uSmFuL3Bvc3Rjc3MtZm9udC1ncmFiYmVyPlxyXG4gKi9cclxuXHJcbmltcG9ydCBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xyXG5pbXBvcnQgRG93bmxvYWRlciBmcm9tICcuL2xpYi9kb3dubG9hZGVyJztcclxuaW1wb3J0ICogYXMgcmVnZXhlcyBmcm9tICcuL2xpYi9yZWdleGVzJztcclxuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2xvZGFzaC9mcC9pbmNsdWRlcyc7XHJcblxyXG4vKipcclxuICpcclxuICovXHJcbmNsYXNzIEZvbnRHcmFiYmVyIHtcclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIHN0YXRpYyBkb3dubG9hZGVyID0gbmV3IERvd25sb2FkZXIoKTtcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcclxuICAgKi9cclxuICBzdGF0aWMgdmFsaWRhdGVQb3N0Y3NzT3B0aW9ucyAocG9zdGNzc09wdHMpIHtcclxuICAgIGlmICghIHBvc3Rjc3NPcHRzLmZyb20pIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb3N0Y3NzLWZvbnQtZ3JhYmJlciByZXF1aXJlcyBwb3N0Y3NzIFwiZnJvbVwiIG9wdGlvbi4nKTtcclxuICAgIH1cclxuICAgIGlmICghIHBvc3Rjc3NPcHRzLnRvIHx8IHBvc3Rjc3NPcHRzLnRvID09PSBwb3N0Y3NzT3B0cy5mcm9tKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigncG9zdGNzcy1mb250LWdyYWJiZXIgcmVxdWlyZXMgcG9zdGNzcyBcInRvXCIgb3B0aW9uLicpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaXRlcmF0b3JcclxuICAgKiBAcmV0dXJucyB7ZnVuY3Rpb24oKX1cclxuICAgKi9cclxuICBzdGF0aWMgaXRlcmF0ZUNTU1J1bGVXaXRoIChpdGVyYXRvcikge1xyXG4gICAgcmV0dXJuIChydWxlKSA9PiB7XHJcbiAgICAgIHJ1bGUuZWFjaChpdGVyYXRvcik7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc3JjXHJcbiAgICogQHJldHVybnMgeyp9XHJcbiAgICovXHJcbiAgc3RhdGljIGdlbmVyYXRlVXJsT2JqZWN0RnJvbVNyYyAoc3JjKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSByZWdleGVzLmV4dHJhY3RVcmxGcm9tRm9udEZhY2VTcmNSZWdleC5leGVjKHNyYyk7XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgcmVzdWx0ID09PSBudWxsID9cclxuICAgICAgbnVsbCA6XHJcbiAgICAgIHVybC5wYXJzZShyZXN1bHRbMl0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0ga2VwdFxyXG4gICAqIEBwYXJhbSB2YWx1ZVxyXG4gICAqIEByZXR1cm5zIHsqfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBrZWVwVW5pcXVlQW5kVmFsaWRGb250RmlsZVVybE9iamVjdCAoa2VwdCwgdmFsdWUpIHtcclxuICAgIGlmIChcclxuICAgICAgdmFsdWUgJiZcclxuICAgICAgcmVnZXhlcy52YWxpZEZvbnRFeHRlbnNpb25SZWdleC50ZXN0KHZhbHVlLnBhdGhuYW1lKSAmJlxyXG4gICAgICAoISBpbmNsdWRlcyhrZXB0LCB2YWx1ZSkpXHJcbiAgICApIHtcclxuICAgICAga2VwdC5wdXNoKHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ga2VwdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGRvd25sb2FkRGlyXHJcbiAgICogQHJldHVybnMge2Z1bmN0aW9uKCl9XHJcbiAgICovXHJcbiAgc3RhdGljIG1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyIChkb3dubG9hZERpcikge1xyXG4gICAgcmV0dXJuIChmb250VXJsT2JqKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZpbGVuYW1lID0gZm9udFVybE9iai5wYXRobmFtZS5zcGxpdCgnLycpLnBvcCgpO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB1cmwgICAgIDogZm9udFVybE9iai5ocmVmLFxyXG4gICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcclxuICAgICAgICBwcm9taXNlIDogRm9udEdyYWJiZXIuZG93bmxvYWRlci5kb3dubG9hZChcclxuICAgICAgICAgIGZvbnRVcmxPYmosXHJcbiAgICAgICAgICBwYXRoLmpvaW4oZG93bmxvYWREaXIsIGZpbGVuYW1lKVxyXG4gICAgICAgICksXHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gb3B0c1xyXG4gICAqIEBwYXJhbSBwb3N0Y3NzT3B0c1xyXG4gICAqL1xyXG4gIHN0YXRpYyByZXZpZXdPcHRpb25zIChvcHRzLCBwb3N0Y3NzT3B0cykge1xyXG4gICAgaWYgKCEgb3B0cy5iYXNlKSB7XHJcbiAgICAgIG9wdHMuYmFzZSA9IHBhdGguZGlybmFtZShwb3N0Y3NzT3B0cy50byk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTa2lwIEZvbnQtRmFjZSBQb3N0Y3NzIG9iamVjdCB0aGF0IGlzOlxyXG4gICAqICAgbm90IGEgRGVjbGFyYXRpb25cclxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiBgc3JjYCBwcm9wZXJ0eVxyXG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIHJlbW90ZSBmb250IGZpbGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSBkZWNsXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgc3RhdGljIHNob3VsZFByb2Nlc3NUaGlzRm9udEZhY2VEZWNsYXJhdGlvbiAoZGVjbCkge1xyXG4gICAgaWYgKGRlY2wudHlwZSAhPT0gJ2RlY2wnKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gZWxzZSBpZiAoZGVjbC5wcm9wICE9PSAnc3JjJykge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9IGVsc2UgaWYgKHJlZ2V4ZXMuaXNGb250RmFjZVNyY0NvbnRhaW5zUmVtb3RlVXJsUmVnZXgudGVzdChkZWNsLnZhbHVlKSA9PT0gZmFsc2UpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRG93bmxvYWQgZm9udCBmaWxlIGFuZCB1cGRhdGUgb3V0cHV0IENTUyBydWxlIGNvcnJlc3BvbmRpbmdseS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBkZWNsIFBvc3Rjc3MgRGVjbGFyYXRpb24gb2JqZWN0LlxyXG4gICAqIEBwYXJhbSBzYXZlRGlyUGF0aFxyXG4gICAqIEBwYXJhbSBjc3NGaWxlUGF0aFxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBkb3dubG9hZEZvbnRBbmRVcGRhdGVEZWNsYXJhdGlvbiAoZGVjbCwgc2F2ZURpclBhdGgsIGNzc0ZpbGVQYXRoKSB7XHJcbiAgICAvL1xyXG4gICAgLy8gT25lIHNyYyBjb3VsZCBoYXZlIG11bHRpcGxlIGB1cmwoKWAsIHRoZXkgYXJlIHNlcGFyYXRlZCB3aXRoIGAsYC5cclxuICAgIC8vXHJcbiAgICBjb25zdCBzcmNVcmxzID0gZGVjbC52YWx1ZVxyXG4gICAgICAuc3BsaXQoJywnKVxyXG4gICAgICAubWFwKHZhbHVlID0+IHZhbHVlLnJlcGxhY2UocmVnZXhlcy50cmltUmVnZXgsICcnKSk7XHJcblxyXG4gICAgLy9cclxuICAgIC8vIFVzZSBgc3JjVXJsc2AgdG8gZ2VuZXJhdGUgVXJsIG9iamVjdHMgZm9yIGRvd25sb2FkLlxyXG4gICAgLy8gVGhpcyB3aWxsIGNoZWNrIHRoZSB2YWxpZGF0aW9uIG9mIGZvbnQgdXJsLCBhbmQgb25seSBrZWVwIHdoaWNoIGlzXHJcbiAgICAvLyB1bmlxdWUuXHJcbiAgICBjb25zdCBmb250RmlsZVVybE9iamVjdHMgPSBzcmNVcmxzXHJcbiAgICAgIC5tYXAoRm9udEdyYWJiZXIuZ2VuZXJhdGVVcmxPYmplY3RGcm9tU3JjKVxyXG4gICAgICAucmVkdWNlKEZvbnRHcmFiYmVyLmtlZXBVbmlxdWVBbmRWYWxpZEZvbnRGaWxlVXJsT2JqZWN0LCBbXSk7XHJcblxyXG4gICAgLy9cclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGZvbnQgZmlsZSBuZWVkcyB0byBiZSBkb3dubG9hZCwgZW5kIHRoaXMgZnVuY3Rpb25cclxuICAgIC8vIE11c3QgcmV0dXJuIGEgcHJvbWlzZS5cclxuICAgIC8vXHJcbiAgICBpZiAoZm9udEZpbGVVcmxPYmplY3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9cclxuICAgIC8vIERvd25sb2FkIGZvbnQgdG8gYHNhdmVEaXJQYXRoYCB1c2luZyBVcmwgb2JqZWN0cyAqKmNvbmN1cnJlbnRseSoqXHJcbiAgICAvLyBhbmQgcmV0dXJuIGBqb2JgIG9iamVjdHMgdGhhdCBjb250YWluOlxyXG4gICAgLy9cclxuICAgIC8vICAgdXJsOiB0aGUgZnVsbCB1cmwgbmVlZHMgdG8gYmUgcmVwbGFjZWRcclxuICAgIC8vICAgZmlsZW5hbWU6IHRoZSBuYW1lIG9mIHRoZSBzYXZlZCBmaWxlXHJcbiAgICAvLyAgIHByb21pc2U6IGEgcHJvbWlzZSB3aWxsIGJlIGZ1bGZpbGxlZCB3aGVuIGRvd25sb2FkIGNvbXBsZXRlZFxyXG4gICAgLy9cclxuICAgIGNvbnN0IGpvYnMgPSBmb250RmlsZVVybE9iamVjdHMubWFwKFxyXG4gICAgICBGb250R3JhYmJlci5tYWtlRm9udERvd25sb2FkSm9iRGlzcGF0Y2hlcihzYXZlRGlyUGF0aClcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvYnMubWFwKGpvYiA9PiBqb2IucHJvbWlzZSkpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIFRoZSBmb250IGZpbGUgbWlnaHQgYmUgc2F2ZWQgaW4gYSBkaWZmZXJlbnQgZGlyZWN0b3J5IHRvIHRoZSBDU1NcclxuICAgICAgICAvLyBmaWxlLCAgYmVmb3JlIHJlcGxhY2UgdGhlIENTUyBydWxlLCB3ZSBoYXZlIHRvIGRlcml2ZSB0aGUgcmVsYXRpdmVcclxuICAgICAgICAvLyBwYXRoIGJldHdlZW4gdGhlbS5cclxuICAgICAgICAvL1xyXG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXHJcbiAgICAgICAgICBwYXRoLmRpcm5hbWUoY3NzRmlsZVBhdGgpLFxyXG4gICAgICAgICAgc2F2ZURpclBhdGhcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIFJlcGxhY2UgQ1NTIHJ1bGUgd2l0aCBldmVyeSBmb250IHRoYXQgZG93bmxvYWRlZC5cclxuICAgICAgICAvL1xyXG4gICAgICAgIGpvYnMubWFwKGpvYiA9PiB7XHJcbiAgICAgICAgICBkZWNsLnZhbHVlID0gZGVjbC52YWx1ZS5yZXBsYWNlKFxyXG4gICAgICAgICAgICBqb2IudXJsLFxyXG4gICAgICAgICAgICBwYXRoLmpvaW4ocmVsYXRpdmVQYXRoLCBqb2IuZmlsZW5hbWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGRvd25sb2FkZXJcclxuICAgKi9cclxuICBzdGF0aWMgc2V0RG93bmxvYWRlciAoZG93bmxvYWRlcikge1xyXG4gICAgRm9udEdyYWJiZXIuZG93bmxvYWRlciA9IGRvd25sb2FkZXI7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtEb3dubG9hZGVyfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXREb3dubG9hZGVyICgpIHtcclxuICAgIHJldHVybiBGb250R3JhYmJlci5kb3dubG9hZGVyO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZSBoYW5kbGUgZnVuY3Rpb24gZm9yIHBsdWdpbiB0byBjYWxsIHdpdGguXHJcbiAgICpcclxuICAgKiBAcGFyYW0gb3B0c1xyXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cclxuICAgKi9cclxuICBzdGF0aWMgbWFrZVBsdWdpbkhhbmRsZXIgKG9wdHMgPSB7fSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjc3MsIHJlc3VsdCkge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBHZXQgdGhlIG9wdGlvbnMgZnJvbSBQb3N0Y3NzIGZvciBsYXRlciB1c2UuXHJcbiAgICAgIC8vXHJcbiAgICAgIGxldCBwb3N0Y3NzT3B0cyA9IHJlc3VsdC5vcHRzO1xyXG5cclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgc29tZXRoaW5nIGlzIG1pc3NpbmcgaW4gdGhlIFBvc3Rjc3Mgb3B0aW9ucywgdGhyb3cgYW4gRXJyb3IuXHJcbiAgICAgIC8vXHJcbiAgICAgIEZvbnRHcmFiYmVyLnZhbGlkYXRlUG9zdGNzc09wdGlvbnMocG9zdGNzc09wdHMpO1xyXG5cclxuICAgICAgLy9cclxuICAgICAgLy8gUmV2aWV3IG9wdGlvbnMgZm9yIEZvbnQgR3JhYmJlciAoVGhpcyBtYXkgbW9kaWZ5IHRoZW0pLlxyXG4gICAgICAvL1xyXG4gICAgICBGb250R3JhYmJlci5yZXZpZXdPcHRpb25zKG9wdHMsIHBvc3Rjc3NPcHRzKTtcclxuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFByb2Nlc3MgZXZlcnkgRGVjbGFyYXRpb24gdGhhdCBtYXRjaHMgcnVsZSBgZm9udC1mYWNlYCBjb25jdXJyZW50bHkuXHJcbiAgICAgIC8vXHJcbiAgICAgIGxldCBwcm9jZXNzUHJvbWlzZXMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uUHJvY2Vzc29yID0gKGRlY2wpID0+IHtcclxuICAgICAgICBpZiAoRm9udEdyYWJiZXIuc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uKGRlY2wpKSB7XHJcbiAgICAgICAgICBwcm9jZXNzUHJvbWlzZXMucHVzaChcclxuICAgICAgICAgICAgRm9udEdyYWJiZXIuZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24oZGVjbCwgb3B0cy5iYXNlLCBwb3N0Y3NzT3B0cy50bylcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY3NzLndhbGtBdFJ1bGVzKC9mb250LWZhY2UvLCBGb250R3JhYmJlci5pdGVyYXRlQ1NTUnVsZVdpdGgoZGVjbGFyYXRpb25Qcm9jZXNzb3IpKTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgcHJvY2Vzc1Byb21pc2VzLmxlbmd0aCA9PT0gMCA/XHJcbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxyXG4gICAgICAgIFByb21pc2UuYWxsKHByb2Nlc3NQcm9taXNlcylcclxuICAgICAgKTtcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5cclxuLy9cclxuLy8gRXhwb3NlIGRlZmF1bHQgbWV0aG9kLlxyXG4vL1xyXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy1mb250LWdyYWJiZXInLCAob3B0cykgPT4ge1xyXG4gIHJldHVybiBGb250R3JhYmJlci5tYWtlUGx1Z2luSGFuZGxlcihvcHRzKTtcclxufSk7XHJcblxyXG4vL1xyXG4vLyBFeHBvc2UgRm9udEdyYWJiZXIgY2xhc3MgZm9yIHRlc3RpbmcgdXNlLlxyXG4vL1xyXG5leHBvcnQgeyBGb250R3JhYmJlciB9OyJdfQ==