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
      if (!postcssOpts.to) {
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
      if (!opts.dirPath) {
        opts.dirPath = _path2.default.dirname(postcssOpts.to);
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
          decl.value = decl.value.replace(job.url,

          //
          // Replace `\\` to `/` for Windows compatibility.
          //
          _path2.default.join(relativePath, job.filename).replace('\\', '/'));
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
            processPromises.push(FontGrabber.downloadFontAndUpdateDeclaration(decl, opts.dirPath, postcssOpts.to));
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
//# sourceMappingURL=data:application/json;base64,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QXhELEVBQWlFLFlBQVksRUFBN0UsQ0FERjtBQUdEO0FBQ0YsU0FORDs7QUFRQSxZQUFJLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNkIsWUFBWSxrQkFBWixDQUErQixvQkFBL0IsQ0FBN0I7O0FBRUEsZUFDRSxnQkFBZ0IsTUFBaEIsS0FBMkIsQ0FBM0IsR0FDQSxRQUFRLE9BQVIsRUFEQSxHQUVBLFFBQVEsR0FBUixDQUFZLGVBQVosQ0FIRjtBQUtELE9BcENEO0FBcUNEOzs7Ozs7Ozs7OztBQXZQRyxXLENBSUcsVSxHQUFhLDBCO2tCQTBQUCxrQkFBUSxNQUFSLENBQWUsc0JBQWYsRUFBdUMsVUFBQyxJQUFELEVBQVU7QUFDOUQsU0FBTyxZQUFZLGlCQUFaLENBQThCLElBQTlCLENBQVA7QUFDRCxDQUZjLEM7Ozs7OztRQU9OLFcsR0FBQSxXIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFBvc3Rjc3MgRm9udCBHcmFiYmVyXHJcbiAqXHJcbiAqIEBsaWNlbnNlICAgICAgICBBcGFjaGUgMi4wXHJcbiAqIEBjb3B5cmlnaHQgIChjKSAyMDE2LCBBYXJvbkphblxyXG4gKiBAYXV0aG9yICAgICAgICAgQWFyb25KYW4gPGh0dHBzOi8vZ2l0aHViLmNvbS9BYXJvbkphbi9wb3N0Y3NzLWZvbnQtZ3JhYmJlcj5cclxuICovXHJcblxyXG5pbXBvcnQgcG9zdGNzcyBmcm9tICdwb3N0Y3NzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcclxuaW1wb3J0IERvd25sb2FkZXIgZnJvbSAnLi9saWIvZG93bmxvYWRlcic7XHJcbmltcG9ydCAqIGFzIHJlZ2V4ZXMgZnJvbSAnLi9saWIvcmVnZXhlcyc7XHJcbmltcG9ydCBpbmNsdWRlcyBmcm9tICdsb2Rhc2gvZnAvaW5jbHVkZXMnO1xyXG5cclxuLyoqXHJcbiAqXHJcbiAqL1xyXG5jbGFzcyBGb250R3JhYmJlciB7XHJcbiAgLyoqXHJcbiAgICpcclxuICAgKi9cclxuICBzdGF0aWMgZG93bmxvYWRlciA9IG5ldyBEb3dubG9hZGVyKCk7XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvc3Rjc3NPcHRzXHJcbiAgICovXHJcbiAgc3RhdGljIHZhbGlkYXRlUG9zdGNzc09wdGlvbnMgKHBvc3Rjc3NPcHRzKSB7XHJcbiAgICBpZiAoISBwb3N0Y3NzT3B0cy5mcm9tKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigncG9zdGNzcy1mb250LWdyYWJiZXIgcmVxdWlyZXMgcG9zdGNzcyBcImZyb21cIiBvcHRpb24uJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoISBwb3N0Y3NzT3B0cy50bykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyIHJlcXVpcmVzIHBvc3Rjc3MgXCJ0b1wiIG9wdGlvbi4nKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGl0ZXJhdG9yXHJcbiAgICogQHJldHVybnMge2Z1bmN0aW9uKCl9XHJcbiAgICovXHJcbiAgc3RhdGljIGl0ZXJhdGVDU1NSdWxlV2l0aCAoaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiAocnVsZSkgPT4ge1xyXG4gICAgICBydWxlLmVhY2goaXRlcmF0b3IpO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNyY1xyXG4gICAqIEByZXR1cm5zIHsqfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZW5lcmF0ZVVybE9iamVjdEZyb21TcmMgKHNyYykge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gcmVnZXhlcy5leHRyYWN0VXJsRnJvbUZvbnRGYWNlU3JjUmVnZXguZXhlYyhzcmMpO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIHJlc3VsdCA9PT0gbnVsbCA/XHJcbiAgICAgIG51bGwgOlxyXG4gICAgICB1cmwucGFyc2UocmVzdWx0WzJdKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGtlcHRcclxuICAgKiBAcGFyYW0gdmFsdWVcclxuICAgKiBAcmV0dXJucyB7Kn1cclxuICAgKi9cclxuICBzdGF0aWMga2VlcFVuaXF1ZUFuZFZhbGlkRm9udEZpbGVVcmxPYmplY3QgKGtlcHQsIHZhbHVlKSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIHZhbHVlICYmXHJcbiAgICAgIHJlZ2V4ZXMudmFsaWRGb250RXh0ZW5zaW9uUmVnZXgudGVzdCh2YWx1ZS5wYXRobmFtZSkgJiZcclxuICAgICAgKCEgaW5jbHVkZXMoa2VwdCwgdmFsdWUpKVxyXG4gICAgKSB7XHJcbiAgICAgIGtlcHQucHVzaCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGtlcHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBkb3dubG9hZERpclxyXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBtYWtlRm9udERvd25sb2FkSm9iRGlzcGF0Y2hlciAoZG93bmxvYWREaXIpIHtcclxuICAgIHJldHVybiAoZm9udFVybE9iaikgPT4ge1xyXG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGZvbnRVcmxPYmoucGF0aG5hbWUuc3BsaXQoJy8nKS5wb3AoKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdXJsICAgICA6IGZvbnRVcmxPYmouaHJlZixcclxuICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXHJcbiAgICAgICAgcHJvbWlzZSA6IEZvbnRHcmFiYmVyLmRvd25sb2FkZXIuZG93bmxvYWQoXHJcbiAgICAgICAgICBmb250VXJsT2JqLFxyXG4gICAgICAgICAgcGF0aC5qb2luKGRvd25sb2FkRGlyLCBmaWxlbmFtZSlcclxuICAgICAgICApLFxyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG9wdHNcclxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcclxuICAgKi9cclxuICBzdGF0aWMgcmV2aWV3T3B0aW9ucyAob3B0cywgcG9zdGNzc09wdHMpIHtcclxuICAgIGlmICghIG9wdHMuZGlyUGF0aCkge1xyXG4gICAgICBvcHRzLmRpclBhdGggPSBwYXRoLmRpcm5hbWUocG9zdGNzc09wdHMudG8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2tpcCBGb250LUZhY2UgUG9zdGNzcyBvYmplY3QgdGhhdCBpczpcclxuICAgKiAgIG5vdCBhIERlY2xhcmF0aW9uXHJcbiAgICogICBvciBkb2Vzbid0IGNvbnRhaW4gYHNyY2AgcHJvcGVydHlcclxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiByZW1vdGUgZm9udCBmaWxlXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGVjbFxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBzaG91bGRQcm9jZXNzVGhpc0ZvbnRGYWNlRGVjbGFyYXRpb24gKGRlY2wpIHtcclxuICAgIGlmIChkZWNsLnR5cGUgIT09ICdkZWNsJykge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9IGVsc2UgaWYgKGRlY2wucHJvcCAhPT0gJ3NyYycpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIGlmIChyZWdleGVzLmlzRm9udEZhY2VTcmNDb250YWluc1JlbW90ZVVybFJlZ2V4LnRlc3QoZGVjbC52YWx1ZSkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERvd25sb2FkIGZvbnQgZmlsZSBhbmQgdXBkYXRlIG91dHB1dCBDU1MgcnVsZSBjb3JyZXNwb25kaW5nbHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGVjbCBQb3N0Y3NzIERlY2xhcmF0aW9uIG9iamVjdC5cclxuICAgKiBAcGFyYW0gc2F2ZURpclBhdGhcclxuICAgKiBAcGFyYW0gY3NzRmlsZVBhdGhcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBzdGF0aWMgZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24gKGRlY2wsIHNhdmVEaXJQYXRoLCBjc3NGaWxlUGF0aCkge1xyXG4gICAgLy9cclxuICAgIC8vIE9uZSBzcmMgY291bGQgaGF2ZSBtdWx0aXBsZSBgdXJsKClgLCB0aGV5IGFyZSBzZXBhcmF0ZWQgd2l0aCBgLGAuXHJcbiAgICAvL1xyXG4gICAgY29uc3Qgc3JjVXJscyA9IGRlY2wudmFsdWVcclxuICAgICAgLnNwbGl0KCcsJylcclxuICAgICAgLm1hcCh2YWx1ZSA9PiB2YWx1ZS5yZXBsYWNlKHJlZ2V4ZXMudHJpbVJlZ2V4LCAnJykpO1xyXG5cclxuICAgIC8vXHJcbiAgICAvLyBVc2UgYHNyY1VybHNgIHRvIGdlbmVyYXRlIFVybCBvYmplY3RzIGZvciBkb3dubG9hZC5cclxuICAgIC8vIFRoaXMgd2lsbCBjaGVjayB0aGUgdmFsaWRhdGlvbiBvZiBmb250IHVybCwgYW5kIG9ubHkga2VlcCB3aGljaCBpc1xyXG4gICAgLy8gdW5pcXVlLlxyXG4gICAgY29uc3QgZm9udEZpbGVVcmxPYmplY3RzID0gc3JjVXJsc1xyXG4gICAgICAubWFwKEZvbnRHcmFiYmVyLmdlbmVyYXRlVXJsT2JqZWN0RnJvbVNyYylcclxuICAgICAgLnJlZHVjZShGb250R3JhYmJlci5rZWVwVW5pcXVlQW5kVmFsaWRGb250RmlsZVVybE9iamVjdCwgW10pO1xyXG5cclxuICAgIC8vXHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb250IGZpbGUgbmVlZHMgdG8gYmUgZG93bmxvYWQsIGVuZCB0aGlzIGZ1bmN0aW9uXHJcbiAgICAvLyBNdXN0IHJldHVybiBhIHByb21pc2UuXHJcbiAgICAvL1xyXG4gICAgaWYgKGZvbnRGaWxlVXJsT2JqZWN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vXHJcbiAgICAvLyBEb3dubG9hZCBmb250IHRvIGBzYXZlRGlyUGF0aGAgdXNpbmcgVXJsIG9iamVjdHMgKipjb25jdXJyZW50bHkqKlxyXG4gICAgLy8gYW5kIHJldHVybiBgam9iYCBvYmplY3RzIHRoYXQgY29udGFpbjpcclxuICAgIC8vXHJcbiAgICAvLyAgIHVybDogdGhlIGZ1bGwgdXJsIG5lZWRzIHRvIGJlIHJlcGxhY2VkXHJcbiAgICAvLyAgIGZpbGVuYW1lOiB0aGUgbmFtZSBvZiB0aGUgc2F2ZWQgZmlsZVxyXG4gICAgLy8gICBwcm9taXNlOiBhIHByb21pc2Ugd2lsbCBiZSBmdWxmaWxsZWQgd2hlbiBkb3dubG9hZCBjb21wbGV0ZWRcclxuICAgIC8vXHJcbiAgICBjb25zdCBqb2JzID0gZm9udEZpbGVVcmxPYmplY3RzLm1hcChcclxuICAgICAgRm9udEdyYWJiZXIubWFrZUZvbnREb3dubG9hZEpvYkRpc3BhdGNoZXIoc2F2ZURpclBhdGgpXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2JzLm1hcChqb2IgPT4gam9iLnByb21pc2UpKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBUaGUgZm9udCBmaWxlIG1pZ2h0IGJlIHNhdmVkIGluIGEgZGlmZmVyZW50IGRpcmVjdG9yeSB0byB0aGUgQ1NTXHJcbiAgICAgICAgLy8gZmlsZSwgIGJlZm9yZSByZXBsYWNlIHRoZSBDU1MgcnVsZSwgd2UgaGF2ZSB0byBkZXJpdmUgdGhlIHJlbGF0aXZlXHJcbiAgICAgICAgLy8gcGF0aCBiZXR3ZWVuIHRoZW0uXHJcbiAgICAgICAgLy9cclxuICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKFxyXG4gICAgICAgICAgcGF0aC5kaXJuYW1lKGNzc0ZpbGVQYXRoKSxcclxuICAgICAgICAgIHNhdmVEaXJQYXRoXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBSZXBsYWNlIENTUyBydWxlIHdpdGggZXZlcnkgZm9udCB0aGF0IGRvd25sb2FkZWQuXHJcbiAgICAgICAgLy9cclxuICAgICAgICBqb2JzLm1hcChqb2IgPT4ge1xyXG4gICAgICAgICAgZGVjbC52YWx1ZSA9IGRlY2wudmFsdWUucmVwbGFjZShcclxuICAgICAgICAgICAgam9iLnVybCxcclxuXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgYFxcXFxgIHRvIGAvYCBmb3IgV2luZG93cyBjb21wYXRpYmlsaXR5LlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICBwYXRoLmpvaW4ocmVsYXRpdmVQYXRoLCBqb2IuZmlsZW5hbWUpLnJlcGxhY2UoJ1xcXFwnLCAnLycpXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGRvd25sb2FkZXJcclxuICAgKi9cclxuICBzdGF0aWMgc2V0RG93bmxvYWRlciAoZG93bmxvYWRlcikge1xyXG4gICAgRm9udEdyYWJiZXIuZG93bmxvYWRlciA9IGRvd25sb2FkZXI7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtEb3dubG9hZGVyfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXREb3dubG9hZGVyICgpIHtcclxuICAgIHJldHVybiBGb250R3JhYmJlci5kb3dubG9hZGVyO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZSBoYW5kbGUgZnVuY3Rpb24gZm9yIHBsdWdpbiB0byBjYWxsIHdpdGguXHJcbiAgICpcclxuICAgKiBAcGFyYW0gb3B0c1xyXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cclxuICAgKi9cclxuICBzdGF0aWMgbWFrZVBsdWdpbkhhbmRsZXIgKG9wdHMgPSB7fSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjc3MsIHJlc3VsdCkge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBHZXQgdGhlIG9wdGlvbnMgZnJvbSBQb3N0Y3NzIGZvciBsYXRlciB1c2UuXHJcbiAgICAgIC8vXHJcbiAgICAgIGxldCBwb3N0Y3NzT3B0cyA9IHJlc3VsdC5vcHRzO1xyXG5cclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgc29tZXRoaW5nIGlzIG1pc3NpbmcgaW4gdGhlIFBvc3Rjc3Mgb3B0aW9ucywgdGhyb3cgYW4gRXJyb3IuXHJcbiAgICAgIC8vXHJcbiAgICAgIEZvbnRHcmFiYmVyLnZhbGlkYXRlUG9zdGNzc09wdGlvbnMocG9zdGNzc09wdHMpO1xyXG5cclxuICAgICAgLy9cclxuICAgICAgLy8gUmV2aWV3IG9wdGlvbnMgZm9yIEZvbnQgR3JhYmJlciAoVGhpcyBtYXkgbW9kaWZ5IHRoZW0pLlxyXG4gICAgICAvL1xyXG4gICAgICBGb250R3JhYmJlci5yZXZpZXdPcHRpb25zKG9wdHMsIHBvc3Rjc3NPcHRzKTtcclxuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFByb2Nlc3MgZXZlcnkgRGVjbGFyYXRpb24gdGhhdCBtYXRjaHMgcnVsZSBgZm9udC1mYWNlYCBjb25jdXJyZW50bHkuXHJcbiAgICAgIC8vXHJcbiAgICAgIGxldCBwcm9jZXNzUHJvbWlzZXMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uUHJvY2Vzc29yID0gKGRlY2wpID0+IHtcclxuICAgICAgICBpZiAoRm9udEdyYWJiZXIuc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uKGRlY2wpKSB7XHJcbiAgICAgICAgICBwcm9jZXNzUHJvbWlzZXMucHVzaChcclxuICAgICAgICAgICAgRm9udEdyYWJiZXIuZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24oZGVjbCwgb3B0cy5kaXJQYXRoLCBwb3N0Y3NzT3B0cy50bylcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY3NzLndhbGtBdFJ1bGVzKC9mb250LWZhY2UvLCBGb250R3JhYmJlci5pdGVyYXRlQ1NTUnVsZVdpdGgoZGVjbGFyYXRpb25Qcm9jZXNzb3IpKTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgcHJvY2Vzc1Byb21pc2VzLmxlbmd0aCA9PT0gMCA/XHJcbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgOlxyXG4gICAgICAgIFByb21pc2UuYWxsKHByb2Nlc3NQcm9taXNlcylcclxuICAgICAgKTtcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5cclxuLy9cclxuLy8gRXhwb3NlIGRlZmF1bHQgbWV0aG9kLlxyXG4vL1xyXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy1mb250LWdyYWJiZXInLCAob3B0cykgPT4ge1xyXG4gIHJldHVybiBGb250R3JhYmJlci5tYWtlUGx1Z2luSGFuZGxlcihvcHRzKTtcclxufSk7XHJcblxyXG4vL1xyXG4vLyBFeHBvc2UgRm9udEdyYWJiZXIgY2xhc3MgZm9yIHRlc3RpbmcgdXNlLlxyXG4vL1xyXG5leHBvcnQgeyBGb250R3JhYmJlciB9OyJdfQ==