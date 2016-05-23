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
        throw new Error('postcss-copy-assets requires postcss "from" option.');
      }
      if (!postcssOpts.to || postcssOpts.to === postcssOpts.from) {
        throw new Error('postcss-copy-assets requires postcss "to" option.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFRQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJQUFZLE87O0FBQ1o7Ozs7Ozs7Ozs7Ozs7O0lBS00sVzs7Ozs7Ozs7Ozs7OzsyQ0FVMkIsVyxFQUFhO0FBQzFDLFVBQUksQ0FBRSxZQUFZLElBQWxCLEVBQXdCO0FBQ3RCLGNBQU0sSUFBSSxLQUFKLENBQVUscURBQVYsQ0FBTjtBQUNEO0FBQ0QsVUFBSSxDQUFFLFlBQVksRUFBZCxJQUFvQixZQUFZLEVBQVosS0FBbUIsWUFBWSxJQUF2RCxFQUE2RDtBQUMzRCxjQUFNLElBQUksS0FBSixDQUFVLG1EQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7Ozs7Ozs7Ozt1Q0FPMEIsUSxFQUFVO0FBQ25DLGFBQU8sVUFBQyxJQUFELEVBQVU7QUFDZixhQUFLLElBQUwsQ0FBVSxRQUFWO0FBQ0QsT0FGRDtBQUdEOzs7Ozs7Ozs7OzZDQU9nQyxHLEVBQUs7QUFDcEMsVUFBTSxTQUFTLFFBQVEsOEJBQVIsQ0FBdUMsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBZjs7QUFFQSxhQUNFLFdBQVcsSUFBWCxHQUNBLElBREEsR0FFQSxjQUFJLEtBQUosQ0FBVSxPQUFPLENBQVAsQ0FBVixDQUhGO0FBS0Q7Ozs7Ozs7Ozs7O3dEQVEyQyxJLEVBQU0sSyxFQUFPO0FBQ3ZELFVBQ0UsU0FDQSxRQUFRLHVCQUFSLENBQWdDLElBQWhDLENBQXFDLE1BQU0sUUFBM0MsQ0FEQSxJQUVDLENBQUUsd0JBQVMsSUFBVCxFQUFlLEtBQWYsQ0FITCxFQUlFO0FBQ0EsYUFBSyxJQUFMLENBQVUsS0FBVjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7O2tEQU9xQyxXLEVBQWE7QUFDakQsYUFBTyxVQUFDLFVBQUQsRUFBZ0I7QUFDckIsWUFBTSxXQUFXLFdBQVcsUUFBWCxDQUFvQixLQUFwQixDQUEwQixHQUExQixFQUEr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WUFBWSxFQUExRSxDQURGO0FBR0Q7QUFDRixTQU5EOztBQVFBLFlBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QixZQUFZLGtCQUFaLENBQStCLG9CQUEvQixDQUE3Qjs7QUFFQSxlQUNFLGdCQUFnQixNQUFoQixLQUEyQixDQUEzQixHQUNBLFFBQVEsT0FBUixFQURBLEdBRUEsUUFBUSxHQUFSLENBQVksZUFBWixDQUhGO0FBS0QsT0FwQ0Q7QUFxQ0Q7Ozs7Ozs7Ozs7O0FBblBHLFcsQ0FJRyxVLEdBQWEsMEI7a0JBc1BQLGtCQUFRLE1BQVIsQ0FBZSxzQkFBZixFQUF1QyxVQUFDLElBQUQsRUFBVTtBQUM5RCxTQUFPLFlBQVksaUJBQVosQ0FBOEIsSUFBOUIsQ0FBUDtBQUNELENBRmMsQzs7Ozs7O1FBT04sVyxHQUFBLFciLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogUG9zdGNzcyBGb250IEdyYWJiZXJcclxuICpcclxuICogQGxpY2Vuc2UgICAgICAgIEFwYWNoZSAyLjBcclxuICogQGNvcHlyaWdodCAgKGMpIDIwMTYsIEFhcm9uSmFuXHJcbiAqIEBhdXRob3IgICAgICAgICBBYXJvbkphbiA8aHR0cHM6Ly9naXRodWIuY29tL0Fhcm9uSmFuL3Bvc3Rjc3MtZm9udC1ncmFiYmVyPlxyXG4gKi9cclxuXHJcbmltcG9ydCBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xyXG5pbXBvcnQgRG93bmxvYWRlciBmcm9tICcuL2xpYi9kb3dubG9hZGVyJztcclxuaW1wb3J0ICogYXMgcmVnZXhlcyBmcm9tICcuL2xpYi9yZWdleGVzJztcclxuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2xvZGFzaC9mcC9pbmNsdWRlcyc7XHJcblxyXG4vKipcclxuICpcclxuICovXHJcbmNsYXNzIEZvbnRHcmFiYmVyIHtcclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIHN0YXRpYyBkb3dubG9hZGVyID0gbmV3IERvd25sb2FkZXIoKTtcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcclxuICAgKi9cclxuICBzdGF0aWMgdmFsaWRhdGVQb3N0Y3NzT3B0aW9ucyAocG9zdGNzc09wdHMpIHtcclxuICAgIGlmICghIHBvc3Rjc3NPcHRzLmZyb20pIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb3N0Y3NzLWNvcHktYXNzZXRzIHJlcXVpcmVzIHBvc3Rjc3MgXCJmcm9tXCIgb3B0aW9uLicpO1xyXG4gICAgfVxyXG4gICAgaWYgKCEgcG9zdGNzc09wdHMudG8gfHwgcG9zdGNzc09wdHMudG8gPT09IHBvc3Rjc3NPcHRzLmZyb20pIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb3N0Y3NzLWNvcHktYXNzZXRzIHJlcXVpcmVzIHBvc3Rjc3MgXCJ0b1wiIG9wdGlvbi4nKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGl0ZXJhdG9yXHJcbiAgICogQHJldHVybnMge2Z1bmN0aW9uKCl9XHJcbiAgICovXHJcbiAgc3RhdGljIGl0ZXJhdGVDU1NSdWxlV2l0aCAoaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiAocnVsZSkgPT4ge1xyXG4gICAgICBydWxlLmVhY2goaXRlcmF0b3IpO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNyY1xyXG4gICAqIEByZXR1cm5zIHsqfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZW5lcmF0ZVVybE9iamVjdEZyb21TcmMgKHNyYykge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gcmVnZXhlcy5leHRyYWN0VXJsRnJvbUZvbnRGYWNlU3JjUmVnZXguZXhlYyhzcmMpO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIHJlc3VsdCA9PT0gbnVsbCA/XHJcbiAgICAgIG51bGwgOlxyXG4gICAgICB1cmwucGFyc2UocmVzdWx0WzJdKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGtlcHRcclxuICAgKiBAcGFyYW0gdmFsdWVcclxuICAgKiBAcmV0dXJucyB7Kn1cclxuICAgKi9cclxuICBzdGF0aWMga2VlcFVuaXF1ZUFuZFZhbGlkRm9udEZpbGVVcmxPYmplY3QgKGtlcHQsIHZhbHVlKSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIHZhbHVlICYmXHJcbiAgICAgIHJlZ2V4ZXMudmFsaWRGb250RXh0ZW5zaW9uUmVnZXgudGVzdCh2YWx1ZS5wYXRobmFtZSkgJiZcclxuICAgICAgKCEgaW5jbHVkZXMoa2VwdCwgdmFsdWUpKVxyXG4gICAgKSB7XHJcbiAgICAgIGtlcHQucHVzaCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGtlcHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBkb3dubG9hZERpclxyXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYWtlRm9udERvd25sb2FkSm9iRGlzcGF0Y2hlciAoZG93bmxvYWREaXIpIHtcclxuICAgIHJldHVybiAoZm9udFVybE9iaikgPT4ge1xyXG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGZvbnRVcmxPYmoucGF0aG5hbWUuc3BsaXQoJy8nKS5wb3AoKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdXJsICAgICA6IGZvbnRVcmxPYmouaHJlZixcclxuICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXHJcbiAgICAgICAgcHJvbWlzZSA6IEZvbnRHcmFiYmVyLmRvd25sb2FkZXIuZG93bmxvYWQoXHJcbiAgICAgICAgICBmb250VXJsT2JqLFxyXG4gICAgICAgICAgcGF0aC5qb2luKGRvd25sb2FkRGlyLCBmaWxlbmFtZSlcclxuICAgICAgICApLFxyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG9wdHNcclxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcclxuICAgKi9cclxuICBzdGF0aWMgcmV2aWV3T3B0aW9ucyAob3B0cywgcG9zdGNzc09wdHMpIHtcclxuICAgIGlmICghIG9wdHMuYmFzZSkge1xyXG4gICAgICBvcHRzLmJhc2UgPSBwYXRoLmRpcm5hbWUocG9zdGNzc09wdHMudG8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2tpcCBGb250LUZhY2UgUG9zdGNzcyBvYmplY3QgdGhhdCBpczpcclxuICAgKiAgIG5vdCBhIERlY2xhcmF0aW9uXHJcbiAgICogICBvciBkb2Vzbid0IGNvbnRhaW4gYHNyY2AgcHJvcGVydHlcclxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiByZW1vdGUgZm9udCBmaWxlXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGVjbFxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBzaG91bGRQcm9jZXNzVGhpc0ZvbnRGYWNlRGVjbGFyYXRpb24gKGRlY2wpIHtcclxuICAgIGlmIChkZWNsLnR5cGUgIT09ICdkZWNsJykge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9IGVsc2UgaWYgKGRlY2wucHJvcCAhPT0gJ3NyYycpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIGlmIChyZWdleGVzLmlzRm9udEZhY2VTcmNDb250YWluc1JlbW90ZVVybFJlZ2V4LnRlc3QoZGVjbC52YWx1ZSkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERvd25sb2FkIGZvbnQgZmlsZSBhbmQgdXBkYXRlIG91dHB1dCBDU1MgcnVsZSBjb3JyZXNwb25kaW5nbHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGVjbCBQb3N0Y3NzIERlY2xhcmF0aW9uIG9iamVjdC5cclxuICAgKiBAcGFyYW0gc2F2ZURpclBhdGhcclxuICAgKiBAcGFyYW0gY3NzRmlsZVBhdGhcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBzdGF0aWMgZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24gKGRlY2wsIHNhdmVEaXJQYXRoLCBjc3NGaWxlUGF0aCkge1xyXG4gICAgLy9cclxuICAgIC8vIE9uZSBzcmMgY291bGQgaGF2ZSBtdWx0aXBsZSBgdXJsKClgLCB0aGV5IGFyZSBzZXBhcmF0ZWQgd2l0aCBgLGAuXHJcbiAgICAvL1xyXG4gICAgY29uc3Qgc3JjVXJscyA9IGRlY2wudmFsdWVcclxuICAgICAgLnNwbGl0KCcsJylcclxuICAgICAgLm1hcCh2YWx1ZSA9PiB2YWx1ZS5yZXBsYWNlKHJlZ2V4ZXMudHJpbVJlZ2V4LCAnJykpO1xyXG5cclxuICAgIC8vXHJcbiAgICAvLyBVc2UgYHNyY1VybHNgIHRvIGdlbmVyYXRlIFVybCBvYmplY3RzIGZvciBkb3dubG9hZC5cclxuICAgIC8vIFRoaXMgd2lsbCBjaGVjayB0aGUgdmFsaWRhdGlvbiBvZiBmb250IHVybCwgYW5kIG9ubHkga2VlcCB3aGljaCBpc1xyXG4gICAgLy8gdW5pcXVlLlxyXG4gICAgY29uc3QgZm9udEZpbGVVcmxPYmplY3RzID0gc3JjVXJsc1xyXG4gICAgICAubWFwKEZvbnRHcmFiYmVyLmdlbmVyYXRlVXJsT2JqZWN0RnJvbVNyYylcclxuICAgICAgLnJlZHVjZShGb250R3JhYmJlci5rZWVwVW5pcXVlQW5kVmFsaWRGb250RmlsZVVybE9iamVjdCwgW10pO1xyXG5cclxuICAgIC8vXHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb250IGZpbGUgbmVlZHMgdG8gYmUgZG93bmxvYWQsIGVuZCB0aGlzIGZ1bmN0aW9uXHJcbiAgICAvLyBNdXN0IHJldHVybiBhIHByb21pc2UuXHJcbiAgICAvL1xyXG4gICAgaWYgKGZvbnRGaWxlVXJsT2JqZWN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vXHJcbiAgICAvLyBEb3dubG9hZCBmb250IHRvIGBzYXZlRGlyUGF0aGAgdXNpbmcgVXJsIG9iamVjdHMgKipjb25jdXJyZW50bHkqKlxyXG4gICAgLy8gYW5kIHJldHVybiBgam9iYCBvYmplY3RzIHRoYXQgY29udGFpbjpcclxuICAgIC8vXHJcbiAgICAvLyAgIHVybDogdGhlIGZ1bGwgdXJsIG5lZWRzIHRvIGJlIHJlcGxhY2VkXHJcbiAgICAvLyAgIGZpbGVuYW1lOiB0aGUgbmFtZSBvZiB0aGUgc2F2ZWQgZmlsZVxyXG4gICAgLy8gICBwcm9taXNlOiBhIHByb21pc2Ugd2lsbCBiZSBmdWxmaWxsZWQgd2hlbiBkb3dubG9hZCBjb21wbGV0ZWRcclxuICAgIC8vXHJcbiAgICBjb25zdCBqb2JzID0gZm9udEZpbGVVcmxPYmplY3RzLm1hcChcclxuICAgICAgRm9udEdyYWJiZXIubWFrZUZvbnREb3dubG9hZEpvYkRpc3BhdGNoZXIoc2F2ZURpclBhdGgpXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2JzLm1hcChqb2IgPT4gam9iLnByb21pc2UpKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBUaGUgZm9udCBmaWxlIG1pZ2h0IGJlIHNhdmVkIGluIGEgZGlmZmVyZW50IGRpcmVjdG9yeSB0byB0aGUgQ1NTXHJcbiAgICAgICAgLy8gZmlsZSwgIGJlZm9yZSByZXBsYWNlIHRoZSBDU1MgcnVsZSwgd2UgaGF2ZSB0byBkZXJpdmUgdGhlIHJlbGF0aXZlXHJcbiAgICAgICAgLy8gcGF0aCBiZXR3ZWVuIHRoZW0uXHJcbiAgICAgICAgLy9cclxuICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKFxyXG4gICAgICAgICAgcGF0aC5kaXJuYW1lKGNzc0ZpbGVQYXRoKSxcclxuICAgICAgICAgIHNhdmVEaXJQYXRoXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBSZXBsYWNlIENTUyBydWxlIHdpdGggZXZlcnkgZm9udCB0aGF0IGRvd25sb2FkZWQuXHJcbiAgICAgICAgLy9cclxuICAgICAgICBqb2JzLm1hcChqb2IgPT4ge1xyXG4gICAgICAgICAgZGVjbC52YWx1ZSA9IGRlY2wudmFsdWUucmVwbGFjZShcclxuICAgICAgICAgICAgam9iLnVybCxcclxuICAgICAgICAgICAgcGF0aC5qb2luKHJlbGF0aXZlUGF0aCwgam9iLmZpbGVuYW1lKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBkb3dubG9hZGVyXHJcbiAgICovXHJcbiAgc3RhdGljIHNldERvd25sb2FkZXIgKGRvd25sb2FkZXIpIHtcclxuICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkZXIgPSBkb3dubG9hZGVyO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7RG93bmxvYWRlcn1cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0RG93bmxvYWRlciAoKSB7XHJcbiAgICByZXR1cm4gRm9udEdyYWJiZXIuZG93bmxvYWRlcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2UgaGFuZGxlIGZ1bmN0aW9uIGZvciBwbHVnaW4gdG8gY2FsbCB3aXRoLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG9wdHNcclxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XHJcbiAgICovXHJcbiAgc3RhdGljIG1ha2VQbHVnaW5IYW5kbGVyIChvcHRzID0ge30pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoY3NzLCByZXN1bHQpIHtcclxuICAgICAgLy9cclxuICAgICAgLy8gR2V0IHRoZSBvcHRpb25zIGZyb20gUG9zdGNzcyBmb3IgbGF0ZXIgdXNlLlxyXG4gICAgICAvL1xyXG4gICAgICBsZXQgcG9zdGNzc09wdHMgPSByZXN1bHQub3B0cztcclxuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHNvbWV0aGluZyBpcyBtaXNzaW5nIGluIHRoZSBQb3N0Y3NzIG9wdGlvbnMsIHRocm93IGFuIEVycm9yLlxyXG4gICAgICAvL1xyXG4gICAgICBGb250R3JhYmJlci52YWxpZGF0ZVBvc3Rjc3NPcHRpb25zKHBvc3Rjc3NPcHRzKTtcclxuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFJldmlldyBvcHRpb25zIGZvciBGb250IEdyYWJiZXIgKFRoaXMgbWF5IG1vZGlmeSB0aGVtKS5cclxuICAgICAgLy9cclxuICAgICAgRm9udEdyYWJiZXIucmV2aWV3T3B0aW9ucyhvcHRzLCBwb3N0Y3NzT3B0cyk7XHJcblxyXG4gICAgICAvL1xyXG4gICAgICAvLyBQcm9jZXNzIGV2ZXJ5IERlY2xhcmF0aW9uIHRoYXQgbWF0Y2hzIHJ1bGUgYGZvbnQtZmFjZWAgY29uY3VycmVudGx5LlxyXG4gICAgICAvL1xyXG4gICAgICBsZXQgcHJvY2Vzc1Byb21pc2VzID0gW107XHJcblxyXG4gICAgICBjb25zdCBkZWNsYXJhdGlvblByb2Nlc3NvciA9IChkZWNsKSA9PiB7XHJcbiAgICAgICAgaWYgKEZvbnRHcmFiYmVyLnNob3VsZFByb2Nlc3NUaGlzRm9udEZhY2VEZWNsYXJhdGlvbihkZWNsKSkge1xyXG4gICAgICAgICAgcHJvY2Vzc1Byb21pc2VzLnB1c2goXHJcbiAgICAgICAgICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkRm9udEFuZFVwZGF0ZURlY2xhcmF0aW9uKGRlY2wsIG9wdHMuYmFzZSwgcG9zdGNzc09wdHMudG8pXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNzcy53YWxrQXRSdWxlcygvZm9udC1mYWNlLywgRm9udEdyYWJiZXIuaXRlcmF0ZUNTU1J1bGVXaXRoKGRlY2xhcmF0aW9uUHJvY2Vzc29yKSk7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIHByb2Nlc3NQcm9taXNlcy5sZW5ndGggPT09IDAgP1xyXG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcclxuICAgICAgICBQcm9taXNlLmFsbChwcm9jZXNzUHJvbWlzZXMpXHJcbiAgICAgICk7XHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuXHJcbi8vXHJcbi8vIEV4cG9zZSBkZWZhdWx0IG1ldGhvZC5cclxuLy9cclxuZXhwb3J0IGRlZmF1bHQgcG9zdGNzcy5wbHVnaW4oJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyJywgKG9wdHMpID0+IHtcclxuICByZXR1cm4gRm9udEdyYWJiZXIubWFrZVBsdWdpbkhhbmRsZXIob3B0cyk7XHJcbn0pO1xyXG5cclxuLy9cclxuLy8gRXhwb3NlIEZvbnRHcmFiYmVyIGNsYXNzIGZvciB0ZXN0aW5nIHVzZS5cclxuLy9cclxuZXhwb3J0IHsgRm9udEdyYWJiZXIgfTsiXX0=