'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _downloader = require('./downloader');

var _downloader2 = _interopRequireDefault(_downloader);

var _regexes = require('./regexes');

var regexes = _interopRequireWildcard(_regexes);

var _includes = require('lodash/fp/includes');

var _includes2 = _interopRequireDefault(_includes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The Font Grabber.
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

      return result === null ? null : _url2.default.parse(result[1]);
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
      } else if (regexes.isFontFaceSrcContainsRemoteFontUrlRegex.test(decl.value) === false) {
        return false;
      }

      return true;
    }

    /**
     *
     * @param urlSrcSources
     * @param srcSource
     * @returns {Array}
     */

  }, {
    key: 'keepUrlSrcSourceOnly',
    value: function keepUrlSrcSourceOnly(urlSrcSources, srcSource) {
      return regexes.isRemoteFontUrlRegex.test(srcSource) ? [].concat(_toConsumableArray(urlSrcSources), [srcSource]) : urlSrcSources;
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
      // This will be used to calculate relative path.
      //
      var cssFileDirPath = _path2.default.dirname(cssFilePath);

      //
      // One src could have multiple `source`, they are separated with `,`,
      // so break it down and filter out those which isn't an `url` source.
      //
      var urlSrcSources = decl.value.split(',').map(function trim(srcSources) {
        return srcSources.replace(regexes.trimRegex, '');
      }).reduce(FontGrabber.keepUrlSrcSourceOnly, []);

      //
      // Use `urlSrcSources` to generate Url objects for download.
      // This will check the validation of font url, and only keep which is
      // unique.
      var fontFileUrlObjects = urlSrcSources.map(FontGrabber.generateUrlObjectFromSrc).reduce(FontGrabber.keepUniqueAndValidFontFileUrlObject, []);

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
        // file, before replace the CSS rule, we have to derive the relative
        // path between them.
        //
        var relativePath = _path2.default.relative(cssFileDirPath, saveDirPath);

        //
        // Replace CSS rule with every font that downloaded.
        //
        jobs.map(function (job) {
          decl.value = decl.value.replace(job.url,

          //
          // Replace `\\` to `/` for Windows compatibility.
          //
          _path2.default.join(relativePath, job.filename).replace(/\\/g, '/'));
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

FontGrabber.downloader = new _downloader2.default();
exports.default = FontGrabber;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZm9udC1ncmFiYmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztvakJBQUE7Ozs7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVksTzs7QUFDWjs7Ozs7Ozs7Ozs7O0FBR0E7Ozs7SUFHTSxXOzs7Ozs7Ozs7QUFNSjs7OzsyQ0FJK0IsVyxFQUFhO0FBQzFDLFVBQUksQ0FBRSxZQUFZLElBQWxCLEVBQXdCO0FBQ3RCLGNBQU0sSUFBSSxLQUFKLENBQVUsc0RBQVYsQ0FBTjtBQUNEO0FBQ0QsVUFBSSxDQUFFLFlBQVksRUFBbEIsRUFBc0I7QUFDcEIsY0FBTSxJQUFJLEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7O0FBbEJBOzs7Ozs7dUNBdUIyQixRLEVBQVU7QUFDbkMsYUFBTyxVQUFDLElBQUQsRUFBVTtBQUNmLGFBQUssSUFBTCxDQUFVLFFBQVY7QUFDRCxPQUZEO0FBR0Q7O0FBRUQ7Ozs7Ozs7OzZDQUtpQyxHLEVBQUs7QUFDcEMsVUFBTSxTQUFTLFFBQVEsOEJBQVIsQ0FBdUMsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBZjs7QUFFQSxhQUNFLFdBQVcsSUFBWCxHQUNFLElBREYsR0FFRSxjQUFJLEtBQUosQ0FBVSxPQUFPLENBQVAsQ0FBVixDQUhKO0FBS0Q7O0FBRUQ7Ozs7Ozs7Ozt3REFNNEMsSSxFQUFNLEssRUFBTztBQUN2RCxVQUNFLFNBQ0EsUUFBUSx1QkFBUixDQUFnQyxJQUFoQyxDQUFxQyxNQUFNLFFBQTNDLENBREEsSUFFQyxDQUFFLHdCQUFTLElBQVQsRUFBZSxLQUFmLENBSEwsRUFJRTtBQUNBLGFBQUssSUFBTCxDQUFVLEtBQVY7QUFDRDs7QUFFRCxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7a0RBS3NDLFcsRUFBYTtBQUNqRCxhQUFPLFVBQUMsVUFBRCxFQUFnQjtBQUNyQixZQUFNLFdBQVcsV0FBVyxRQUFYLENBQW9CLEtBQXBCLENBQTBCLEdB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QUNEOztBQUVEOzs7Ozs7O29DQUl3QjtBQUN0QixhQUFPLFlBQVksVUFBbkI7QUFDRDs7QUFFRDs7Ozs7Ozs7O3dDQU1xQztBQUFBLFVBQVgsSUFBVyx5REFBSixFQUFJOztBQUNuQyxhQUFPLFVBQVUsR0FBVixFQUFlLE1BQWYsRUFBdUI7QUFDNUI7QUFDQTtBQUNBO0FBQ0EsWUFBSSxjQUFjLE9BQU8sSUFBekI7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0JBQVksc0JBQVosQ0FBbUMsV0FBbkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0JBQVksYUFBWixDQUEwQixJQUExQixFQUFnQyxXQUFoQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFJLGtCQUFrQixFQUF0Qjs7QUFFQSxZQUFNLHVCQUF1QixTQUF2QixvQkFBdUIsQ0FBQyxJQUFELEVBQVU7QUFDckMsY0FBSSxZQUFZLG9DQUFaLENBQWlELElBQWpELENBQUosRUFBNEQ7QUFDMUQsNEJBQWdCLElBQWhCLENBQ0UsWUFBWSxnQ0FBWixDQUE2QyxJQUE3QyxFQUFtRCxLQUFLLE9BQXhELEVBQWlFLFlBQVksRUFBN0UsQ0FERjtBQUdEO0FBQ0YsU0FORDs7QUFRQSxZQUFJLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNkIsWUFBWSxrQkFBWixDQUErQixvQkFBL0IsQ0FBN0I7O0FBRUEsZUFDRSxnQkFBZ0IsTUFBaEIsS0FBMkIsQ0FBM0IsR0FDRSxRQUFRLE9BQVIsRUFERixHQUVFLFFBQVEsR0FBUixDQUFZLGVBQVosQ0FISjtBQUtELE9BcENEO0FBcUNEOzs7Ozs7QUE1UUcsVyxDQUlHLFUsR0FBYSwwQjtrQkEyUVAsVyIsImZpbGUiOiJmb250LWdyYWJiZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IERvd25sb2FkZXIgZnJvbSAnLi9kb3dubG9hZGVyJztcbmltcG9ydCAqIGFzIHJlZ2V4ZXMgZnJvbSAnLi9yZWdleGVzJztcbmltcG9ydCBpbmNsdWRlcyBmcm9tICdsb2Rhc2gvZnAvaW5jbHVkZXMnO1xuXG5cbi8qKlxuICogVGhlIEZvbnQgR3JhYmJlci5cbiAqL1xuY2xhc3MgRm9udEdyYWJiZXIge1xuICAvKipcbiAgICpcbiAgICovXG4gIHN0YXRpYyBkb3dubG9hZGVyID0gbmV3IERvd25sb2FkZXIoKTtcbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZVBvc3Rjc3NPcHRpb25zIChwb3N0Y3NzT3B0cykge1xuICAgIGlmICghIHBvc3Rjc3NPcHRzLmZyb20pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncG9zdGNzcy1mb250LWdyYWJiZXIgcmVxdWlyZXMgcG9zdGNzcyBcImZyb21cIiBvcHRpb24uJyk7XG4gICAgfVxuICAgIGlmICghIHBvc3Rjc3NPcHRzLnRvKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyIHJlcXVpcmVzIHBvc3Rjc3MgXCJ0b1wiIG9wdGlvbi4nKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gaXRlcmF0b3JcbiAgICogQHJldHVybnMge2Z1bmN0aW9uKCl9XG4gICAqL1xuICBzdGF0aWMgaXRlcmF0ZUNTU1J1bGVXaXRoIChpdGVyYXRvcikge1xuICAgIHJldHVybiAocnVsZSkgPT4ge1xuICAgICAgcnVsZS5lYWNoKGl0ZXJhdG9yKTtcbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHNyY1xuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIHN0YXRpYyBnZW5lcmF0ZVVybE9iamVjdEZyb21TcmMgKHNyYykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHJlZ2V4ZXMuZXh0cmFjdFVybEZyb21Gb250RmFjZVNyY1JlZ2V4LmV4ZWMoc3JjKTtcbiAgICBcbiAgICByZXR1cm4gKFxuICAgICAgcmVzdWx0ID09PSBudWxsID9cbiAgICAgICAgbnVsbCA6XG4gICAgICAgIHVybC5wYXJzZShyZXN1bHRbMV0pXG4gICAgKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBrZXB0XG4gICAqIEBwYXJhbSB2YWx1ZVxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIHN0YXRpYyBrZWVwVW5pcXVlQW5kVmFsaWRGb250RmlsZVVybE9iamVjdCAoa2VwdCwgdmFsdWUpIHtcbiAgICBpZiAoXG4gICAgICB2YWx1ZSAmJlxuICAgICAgcmVnZXhlcy52YWxpZEZvbnRFeHRlbnNpb25SZWdleC50ZXN0KHZhbHVlLnBhdGhuYW1lKSAmJlxuICAgICAgKCEgaW5jbHVkZXMoa2VwdCwgdmFsdWUpKVxuICAgICkge1xuICAgICAga2VwdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGtlcHQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZG93bmxvYWREaXJcbiAgICogQHJldHVybnMge2Z1bmN0aW9uKCl9XG4gICAqL1xuICBzdGF0aWMgbWFrZUZvbnREb3dubG9hZEpvYkRpc3BhdGNoZXIgKGRvd25sb2FkRGlyKSB7XG4gICAgcmV0dXJuIChmb250VXJsT2JqKSA9PiB7XG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGZvbnRVcmxPYmoucGF0aG5hbWUuc3BsaXQoJy8nKS5wb3AoKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsICAgICA6IGZvbnRVcmxPYmouaHJlZixcbiAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxuICAgICAgICBwcm9taXNlIDogRm9udEdyYWJiZXIuZG93bmxvYWRlci5kb3dubG9hZChcbiAgICAgICAgICBmb250VXJsT2JqLFxuICAgICAgICAgIHBhdGguam9pbihkb3dubG9hZERpciwgZmlsZW5hbWUpXG4gICAgICAgICksXG4gICAgICB9O1xuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gb3B0c1xuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcbiAgICovXG4gIHN0YXRpYyByZXZpZXdPcHRpb25zIChvcHRzLCBwb3N0Y3NzT3B0cykge1xuICAgIGlmICghIG9wdHMuZGlyUGF0aCkge1xuICAgICAgb3B0cy5kaXJQYXRoID0gcGF0aC5kaXJuYW1lKHBvc3Rjc3NPcHRzLnRvKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTa2lwIEZvbnQtRmFjZSBQb3N0Y3NzIG9iamVjdCB0aGF0IGlzOlxuICAgKiAgIG5vdCBhIERlY2xhcmF0aW9uXG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIGBzcmNgIHByb3BlcnR5XG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIHJlbW90ZSBmb250IGZpbGVcbiAgICpcbiAgICogQHBhcmFtIGRlY2xcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uIChkZWNsKSB7XG4gICAgaWYgKGRlY2wudHlwZSAhPT0gJ2RlY2wnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChkZWNsLnByb3AgIT09ICdzcmMnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChyZWdleGVzLmlzRm9udEZhY2VTcmNDb250YWluc1JlbW90ZUZvbnRVcmxSZWdleC50ZXN0KGRlY2wudmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB1cmxTcmNTb3VyY2VzXG4gICAqIEBwYXJhbSBzcmNTb3VyY2VcbiAgICogQHJldHVybnMge0FycmF5fVxuICAgKi9cbiAgc3RhdGljIGtlZXBVcmxTcmNTb3VyY2VPbmx5ICh1cmxTcmNTb3VyY2VzLCBzcmNTb3VyY2UpIHtcbiAgICByZXR1cm4gcmVnZXhlcy5pc1JlbW90ZUZvbnRVcmxSZWdleC50ZXN0KHNyY1NvdXJjZSkgP1xuICAgICAgWy4uLnVybFNyY1NvdXJjZXMsIHNyY1NvdXJjZV0gOlxuICAgICAgdXJsU3JjU291cmNlcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIERvd25sb2FkIGZvbnQgZmlsZSBhbmQgdXBkYXRlIG91dHB1dCBDU1MgcnVsZSBjb3JyZXNwb25kaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBkZWNsIFBvc3Rjc3MgRGVjbGFyYXRpb24gb2JqZWN0LlxuICAgKiBAcGFyYW0gc2F2ZURpclBhdGhcbiAgICogQHBhcmFtIGNzc0ZpbGVQYXRoXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgc3RhdGljIGRvd25sb2FkRm9udEFuZFVwZGF0ZURlY2xhcmF0aW9uIChkZWNsLCBzYXZlRGlyUGF0aCwgY3NzRmlsZVBhdGgpIHtcbiAgICAvL1xuICAgIC8vIFRoaXMgd2lsbCBiZSB1c2VkIHRvIGNhbGN1bGF0ZSByZWxhdGl2ZSBwYXRoLlxuICAgIC8vXG4gICAgY29uc3QgY3NzRmlsZURpclBhdGggPSBwYXRoLmRpcm5hbWUoY3NzRmlsZVBhdGgpO1xuXG4gICAgLy9cbiAgICAvLyBPbmUgc3JjIGNvdWxkIGhhdmUgbXVsdGlwbGUgYHNvdXJjZWAsIHRoZXkgYXJlIHNlcGFyYXRlZCB3aXRoIGAsYCxcbiAgICAvLyBzbyBicmVhayBpdCBkb3duIGFuZCBmaWx0ZXIgb3V0IHRob3NlIHdoaWNoIGlzbid0IGFuIGB1cmxgIHNvdXJjZS5cbiAgICAvL1xuICAgIGNvbnN0IHVybFNyY1NvdXJjZXMgPSBkZWNsLnZhbHVlXG4gICAgICAuc3BsaXQoJywnKVxuICAgICAgLm1hcChmdW5jdGlvbiB0cmltIChzcmNTb3VyY2VzKSB7XG4gICAgICAgIHJldHVybiBzcmNTb3VyY2VzLnJlcGxhY2UocmVnZXhlcy50cmltUmVnZXgsICcnKTtcbiAgICAgIH0pXG4gICAgICAucmVkdWNlKEZvbnRHcmFiYmVyLmtlZXBVcmxTcmNTb3VyY2VPbmx5LCBbXSk7XG5cbiAgICAvL1xuICAgIC8vIFVzZSBgdXJsU3JjU291cmNlc2AgdG8gZ2VuZXJhdGUgVXJsIG9iamVjdHMgZm9yIGRvd25sb2FkLlxuICAgIC8vIFRoaXMgd2lsbCBjaGVjayB0aGUgdmFsaWRhdGlvbiBvZiBmb250IHVybCwgYW5kIG9ubHkga2VlcCB3aGljaCBpc1xuICAgIC8vIHVuaXF1ZS5cbiAgICBjb25zdCBmb250RmlsZVVybE9iamVjdHMgPSB1cmxTcmNTb3VyY2VzXG4gICAgICAubWFwKEZvbnRHcmFiYmVyLmdlbmVyYXRlVXJsT2JqZWN0RnJvbVNyYylcbiAgICAgIC5yZWR1Y2UoRm9udEdyYWJiZXIua2VlcFVuaXF1ZUFuZFZhbGlkRm9udEZpbGVVcmxPYmplY3QsIFtdKTtcbiAgICBcbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIGZvbnQgZmlsZSBuZWVkcyB0byBiZSBkb3dubG9hZCwgZW5kIHRoaXMgZnVuY3Rpb25cbiAgICAvLyBNdXN0IHJldHVybiBhIHByb21pc2UuXG4gICAgLy9cbiAgICBpZiAoZm9udEZpbGVVcmxPYmplY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBcbiAgICAvL1xuICAgIC8vIERvd25sb2FkIGZvbnQgdG8gYHNhdmVEaXJQYXRoYCB1c2luZyBVcmwgb2JqZWN0cyAqKmNvbmN1cnJlbnRseSoqXG4gICAgLy8gYW5kIHJldHVybiBgam9iYCBvYmplY3RzIHRoYXQgY29udGFpbjpcbiAgICAvL1xuICAgIC8vICAgdXJsOiB0aGUgZnVsbCB1cmwgbmVlZHMgdG8gYmUgcmVwbGFjZWRcbiAgICAvLyAgIGZpbGVuYW1lOiB0aGUgbmFtZSBvZiB0aGUgc2F2ZWQgZmlsZVxuICAgIC8vICAgcHJvbWlzZTogYSBwcm9taXNlIHdpbGwgYmUgZnVsZmlsbGVkIHdoZW4gZG93bmxvYWQgY29tcGxldGVkXG4gICAgLy9cbiAgICBjb25zdCBqb2JzID0gZm9udEZpbGVVcmxPYmplY3RzLm1hcChcbiAgICAgIEZvbnRHcmFiYmVyLm1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyKHNhdmVEaXJQYXRoKVxuICAgICk7XG4gICAgXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvYnMubWFwKGpvYiA9PiBqb2IucHJvbWlzZSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBmb250IGZpbGUgbWlnaHQgYmUgc2F2ZWQgaW4gYSBkaWZmZXJlbnQgZGlyZWN0b3J5IHRvIHRoZSBDU1NcbiAgICAgICAgLy8gZmlsZSwgYmVmb3JlIHJlcGxhY2UgdGhlIENTUyBydWxlLCB3ZSBoYXZlIHRvIGRlcml2ZSB0aGUgcmVsYXRpdmVcbiAgICAgICAgLy8gcGF0aCBiZXR3ZWVuIHRoZW0uXG4gICAgICAgIC8vXG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgY3NzRmlsZURpclBhdGgsXG4gICAgICAgICAgc2F2ZURpclBhdGhcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFJlcGxhY2UgQ1NTIHJ1bGUgd2l0aCBldmVyeSBmb250IHRoYXQgZG93bmxvYWRlZC5cbiAgICAgICAgLy9cbiAgICAgICAgam9icy5tYXAoam9iID0+IHtcbiAgICAgICAgICBkZWNsLnZhbHVlID0gZGVjbC52YWx1ZS5yZXBsYWNlKFxuICAgICAgICAgICAgam9iLnVybCxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFJlcGxhY2UgYFxcXFxgIHRvIGAvYCBmb3IgV2luZG93cyBjb21wYXRpYmlsaXR5LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIHBhdGguam9pbihyZWxhdGl2ZVBhdGgsIGpvYi5maWxlbmFtZSkucmVwbGFjZSgvXFxcXC9nLCAnLycpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBkb3dubG9hZGVyXG4gICAqL1xuICBzdGF0aWMgc2V0RG93bmxvYWRlciAoZG93bmxvYWRlcikge1xuICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkZXIgPSBkb3dubG9hZGVyO1xuICB9XG4gIFxuICAvKipcbiAgICpcbiAgICogQHJldHVybnMge0Rvd25sb2FkZXJ9XG4gICAqL1xuICBzdGF0aWMgZ2V0RG93bmxvYWRlciAoKSB7XG4gICAgcmV0dXJuIEZvbnRHcmFiYmVyLmRvd25sb2FkZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNYWtlIGhhbmRsZSBmdW5jdGlvbiBmb3IgcGx1Z2luIHRvIGNhbGwgd2l0aC5cbiAgICpcbiAgICogQHBhcmFtIG9wdHNcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgKi9cbiAgc3RhdGljIG1ha2VQbHVnaW5IYW5kbGVyIChvcHRzID0ge30pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGNzcywgcmVzdWx0KSB7XG4gICAgICAvL1xuICAgICAgLy8gR2V0IHRoZSBvcHRpb25zIGZyb20gUG9zdGNzcyBmb3IgbGF0ZXIgdXNlLlxuICAgICAgLy9cbiAgICAgIGxldCBwb3N0Y3NzT3B0cyA9IHJlc3VsdC5vcHRzO1xuICAgICAgXG4gICAgICAvL1xuICAgICAgLy8gSWYgc29tZXRoaW5nIGlzIG1pc3NpbmcgaW4gdGhlIFBvc3Rjc3Mgb3B0aW9ucywgdGhyb3cgYW4gRXJyb3IuXG4gICAgICAvL1xuICAgICAgRm9udEdyYWJiZXIudmFsaWRhdGVQb3N0Y3NzT3B0aW9ucyhwb3N0Y3NzT3B0cyk7XG4gICAgICBcbiAgICAgIC8vXG4gICAgICAvLyBSZXZpZXcgb3B0aW9ucyBmb3IgRm9udCBHcmFiYmVyIChUaGlzIG1heSBtb2RpZnkgdGhlbSkuXG4gICAgICAvL1xuICAgICAgRm9udEdyYWJiZXIucmV2aWV3T3B0aW9ucyhvcHRzLCBwb3N0Y3NzT3B0cyk7XG4gICAgICBcbiAgICAgIC8vXG4gICAgICAvLyBQcm9jZXNzIGV2ZXJ5IERlY2xhcmF0aW9uIHRoYXQgbWF0Y2hzIHJ1bGUgYGZvbnQtZmFjZWAgY29uY3VycmVudGx5LlxuICAgICAgLy9cbiAgICAgIGxldCBwcm9jZXNzUHJvbWlzZXMgPSBbXTtcbiAgICAgIFxuICAgICAgY29uc3QgZGVjbGFyYXRpb25Qcm9jZXNzb3IgPSAoZGVjbCkgPT4ge1xuICAgICAgICBpZiAoRm9udEdyYWJiZXIuc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uKGRlY2wpKSB7XG4gICAgICAgICAgcHJvY2Vzc1Byb21pc2VzLnB1c2goXG4gICAgICAgICAgICBGb250R3JhYmJlci5kb3dubG9hZEZvbnRBbmRVcGRhdGVEZWNsYXJhdGlvbihkZWNsLCBvcHRzLmRpclBhdGgsIHBvc3Rjc3NPcHRzLnRvKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNzcy53YWxrQXRSdWxlcygvZm9udC1mYWNlLywgRm9udEdyYWJiZXIuaXRlcmF0ZUNTU1J1bGVXaXRoKGRlY2xhcmF0aW9uUHJvY2Vzc29yKSk7XG4gICAgICBcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHByb2Nlc3NQcm9taXNlcy5sZW5ndGggPT09IDAgP1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgICBQcm9taXNlLmFsbChwcm9jZXNzUHJvbWlzZXMpXG4gICAgICApO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRm9udEdyYWJiZXI7Il19