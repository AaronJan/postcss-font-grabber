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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZm9udC1ncmFiYmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVksTzs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7SUFNTSxXOzs7Ozs7Ozs7Ozs7OzJDQVUyQixXLEVBQWE7QUFDMUMsVUFBSSxDQUFFLFlBQVksSUFBbEIsRUFBd0I7QUFDdEIsY0FBTSxJQUFJLEtBQUosQ0FBVSxzREFBVixDQUFOO0FBQ0Q7QUFDRCxVQUFJLENBQUUsWUFBWSxFQUFsQixFQUFzQjtBQUNwQixjQUFNLElBQUksS0FBSixDQUFVLG9EQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7Ozs7Ozs7Ozt1Q0FPMEIsUSxFQUFVO0FBQ25DLGFBQU8sVUFBQyxJQUFELEVBQVU7QUFDZixhQUFLLElBQUwsQ0FBVSxRQUFWO0FBQ0QsT0FGRDtBQUdEOzs7Ozs7Ozs7OzZDQU9nQyxHLEVBQUs7QUFDcEMsVUFBTSxTQUFTLFFBQVEsOEJBQVIsQ0FBdUMsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBZjs7QUFFQSxhQUNFLFdBQVcsSUFBWCxHQUNBLElBREEsR0FFQSxjQUFJLEtBQUosQ0FBVSxPQUFPLENBQVAsQ0FBVixDQUhGO0FBS0Q7Ozs7Ozs7Ozs7O3dEQVEyQyxJLEVBQU0sSyxFQUFPO0FBQ3ZELFVBQ0UsU0FDQSxRQUFRLHVCQUFSLENBQWdDLElBQWhDLENBQXFDLE1BQU0sUUFBM0MsQ0FEQSxJQUVDLENBQUUsd0JBQVMsSUFBVCxFQUFlLEtBQWYsQ0FITCxFQUlFO0FBQ0EsYUFBSyxJQUFMLENBQVUsS0FBVjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7O2tEQU9xQyxXLEVBQWE7QUFDakQsYUFBTyxVQUFDLFVBQUQsRUFBZ0I7QUFDckIsWUFBTSxXQUFXLFdBQVcsUUFBWCxDQUFvQixLQUFwQixDQUEwQixHQUExQixFQUErQixHQUEvQixFQUFqQjs7QUFFQSxlQUFPO0FBQ0ws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T0FBeEQsRUFBaUUsWUFBWSxFQUE3RSxDQURGO0FBR0Q7QUFDRixTQU5EOztBQVFBLFlBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QixZQUFZLGtCQUFaLENBQStCLG9CQUEvQixDQUE3Qjs7QUFFQSxlQUNFLGdCQUFnQixNQUFoQixLQUEyQixDQUEzQixHQUNBLFFBQVEsT0FBUixFQURBLEdBRUEsUUFBUSxHQUFSLENBQVksZUFBWixDQUhGO0FBS0QsT0FwQ0Q7QUFxQ0Q7Ozs7OztBQXZQRyxXLENBSUcsVSxHQUFhLDBCO2tCQXNQUCxXIiwiZmlsZSI6ImZvbnQtZ3JhYmJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgRG93bmxvYWRlciBmcm9tICcuL2Rvd25sb2FkZXInO1xuaW1wb3J0ICogYXMgcmVnZXhlcyBmcm9tICcuL3JlZ2V4ZXMnO1xuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2xvZGFzaC9mcC9pbmNsdWRlcyc7XG5cblxuLyoqXG4gKiBUaGUgRm9udCBHcmFiYmVyLlxuICovXG5jbGFzcyBGb250R3JhYmJlciB7XG4gIC8qKlxuICAgKlxuICAgKi9cbiAgc3RhdGljIGRvd25sb2FkZXIgPSBuZXcgRG93bmxvYWRlcigpO1xuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZVBvc3Rjc3NPcHRpb25zIChwb3N0Y3NzT3B0cykge1xuICAgIGlmICghIHBvc3Rjc3NPcHRzLmZyb20pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncG9zdGNzcy1mb250LWdyYWJiZXIgcmVxdWlyZXMgcG9zdGNzcyBcImZyb21cIiBvcHRpb24uJyk7XG4gICAgfVxuICAgIGlmICghIHBvc3Rjc3NPcHRzLnRvKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyIHJlcXVpcmVzIHBvc3Rjc3MgXCJ0b1wiIG9wdGlvbi4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGl0ZXJhdG9yXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxuICAgKi9cbiAgc3RhdGljIGl0ZXJhdGVDU1NSdWxlV2l0aCAoaXRlcmF0b3IpIHtcbiAgICByZXR1cm4gKHJ1bGUpID0+IHtcbiAgICAgIHJ1bGUuZWFjaChpdGVyYXRvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gc3JjXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgc3RhdGljIGdlbmVyYXRlVXJsT2JqZWN0RnJvbVNyYyAoc3JjKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gcmVnZXhlcy5leHRyYWN0VXJsRnJvbUZvbnRGYWNlU3JjUmVnZXguZXhlYyhzcmMpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIHJlc3VsdCA9PT0gbnVsbCA/XG4gICAgICBudWxsIDpcbiAgICAgIHVybC5wYXJzZShyZXN1bHRbMl0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ga2VwdFxuICAgKiBAcGFyYW0gdmFsdWVcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzdGF0aWMga2VlcFVuaXF1ZUFuZFZhbGlkRm9udEZpbGVVcmxPYmplY3QgKGtlcHQsIHZhbHVlKSB7XG4gICAgaWYgKFxuICAgICAgdmFsdWUgJiZcbiAgICAgIHJlZ2V4ZXMudmFsaWRGb250RXh0ZW5zaW9uUmVnZXgudGVzdCh2YWx1ZS5wYXRobmFtZSkgJiZcbiAgICAgICghIGluY2x1ZGVzKGtlcHQsIHZhbHVlKSlcbiAgICApIHtcbiAgICAgIGtlcHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtlcHQ7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGRvd25sb2FkRGlyXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxuICAgKi9cbiAgc3RhdGljIG1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyIChkb3dubG9hZERpcikge1xuICAgIHJldHVybiAoZm9udFVybE9iaikgPT4ge1xuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmb250VXJsT2JqLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybCAgICAgOiBmb250VXJsT2JqLmhyZWYsXG4gICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgcHJvbWlzZSA6IEZvbnRHcmFiYmVyLmRvd25sb2FkZXIuZG93bmxvYWQoXG4gICAgICAgICAgZm9udFVybE9iaixcbiAgICAgICAgICBwYXRoLmpvaW4oZG93bmxvYWREaXIsIGZpbGVuYW1lKVxuICAgICAgICApLFxuICAgICAgfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzXG4gICAqIEBwYXJhbSBwb3N0Y3NzT3B0c1xuICAgKi9cbiAgc3RhdGljIHJldmlld09wdGlvbnMgKG9wdHMsIHBvc3Rjc3NPcHRzKSB7XG4gICAgaWYgKCEgb3B0cy5kaXJQYXRoKSB7XG4gICAgICBvcHRzLmRpclBhdGggPSBwYXRoLmRpcm5hbWUocG9zdGNzc09wdHMudG8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTa2lwIEZvbnQtRmFjZSBQb3N0Y3NzIG9iamVjdCB0aGF0IGlzOlxuICAgKiAgIG5vdCBhIERlY2xhcmF0aW9uXG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIGBzcmNgIHByb3BlcnR5XG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIHJlbW90ZSBmb250IGZpbGVcbiAgICpcbiAgICogQHBhcmFtIGRlY2xcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uIChkZWNsKSB7XG4gICAgaWYgKGRlY2wudHlwZSAhPT0gJ2RlY2wnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChkZWNsLnByb3AgIT09ICdzcmMnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChyZWdleGVzLmlzRm9udEZhY2VTcmNDb250YWluc1JlbW90ZVVybFJlZ2V4LnRlc3QoZGVjbC52YWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogRG93bmxvYWQgZm9udCBmaWxlIGFuZCB1cGRhdGUgb3V0cHV0IENTUyBydWxlIGNvcnJlc3BvbmRpbmdseS5cbiAgICpcbiAgICogQHBhcmFtIGRlY2wgUG9zdGNzcyBEZWNsYXJhdGlvbiBvYmplY3QuXG4gICAqIEBwYXJhbSBzYXZlRGlyUGF0aFxuICAgKiBAcGFyYW0gY3NzRmlsZVBhdGhcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBzdGF0aWMgZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24gKGRlY2wsIHNhdmVEaXJQYXRoLCBjc3NGaWxlUGF0aCkge1xuICAgIC8vXG4gICAgLy8gT25lIHNyYyBjb3VsZCBoYXZlIG11bHRpcGxlIGB1cmwoKWAsIHRoZXkgYXJlIHNlcGFyYXRlZCB3aXRoIGAsYC5cbiAgICAvL1xuICAgIGNvbnN0IHNyY1VybHMgPSBkZWNsLnZhbHVlXG4gICAgICAuc3BsaXQoJywnKVxuICAgICAgLm1hcCh2YWx1ZSA9PiB2YWx1ZS5yZXBsYWNlKHJlZ2V4ZXMudHJpbVJlZ2V4LCAnJykpO1xuXG4gICAgLy9cbiAgICAvLyBVc2UgYHNyY1VybHNgIHRvIGdlbmVyYXRlIFVybCBvYmplY3RzIGZvciBkb3dubG9hZC5cbiAgICAvLyBUaGlzIHdpbGwgY2hlY2sgdGhlIHZhbGlkYXRpb24gb2YgZm9udCB1cmwsIGFuZCBvbmx5IGtlZXAgd2hpY2ggaXNcbiAgICAvLyB1bmlxdWUuXG4gICAgY29uc3QgZm9udEZpbGVVcmxPYmplY3RzID0gc3JjVXJsc1xuICAgICAgLm1hcChGb250R3JhYmJlci5nZW5lcmF0ZVVybE9iamVjdEZyb21TcmMpXG4gICAgICAucmVkdWNlKEZvbnRHcmFiYmVyLmtlZXBVbmlxdWVBbmRWYWxpZEZvbnRGaWxlVXJsT2JqZWN0LCBbXSk7XG5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIGZvbnQgZmlsZSBuZWVkcyB0byBiZSBkb3dubG9hZCwgZW5kIHRoaXMgZnVuY3Rpb25cbiAgICAvLyBNdXN0IHJldHVybiBhIHByb21pc2UuXG4gICAgLy9cbiAgICBpZiAoZm9udEZpbGVVcmxPYmplY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8vXG4gICAgLy8gRG93bmxvYWQgZm9udCB0byBgc2F2ZURpclBhdGhgIHVzaW5nIFVybCBvYmplY3RzICoqY29uY3VycmVudGx5KipcbiAgICAvLyBhbmQgcmV0dXJuIGBqb2JgIG9iamVjdHMgdGhhdCBjb250YWluOlxuICAgIC8vXG4gICAgLy8gICB1cmw6IHRoZSBmdWxsIHVybCBuZWVkcyB0byBiZSByZXBsYWNlZFxuICAgIC8vICAgZmlsZW5hbWU6IHRoZSBuYW1lIG9mIHRoZSBzYXZlZCBmaWxlXG4gICAgLy8gICBwcm9taXNlOiBhIHByb21pc2Ugd2lsbCBiZSBmdWxmaWxsZWQgd2hlbiBkb3dubG9hZCBjb21wbGV0ZWRcbiAgICAvL1xuICAgIGNvbnN0IGpvYnMgPSBmb250RmlsZVVybE9iamVjdHMubWFwKFxuICAgICAgRm9udEdyYWJiZXIubWFrZUZvbnREb3dubG9hZEpvYkRpc3BhdGNoZXIoc2F2ZURpclBhdGgpXG4gICAgKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2JzLm1hcChqb2IgPT4gam9iLnByb21pc2UpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgZm9udCBmaWxlIG1pZ2h0IGJlIHNhdmVkIGluIGEgZGlmZmVyZW50IGRpcmVjdG9yeSB0byB0aGUgQ1NTXG4gICAgICAgIC8vIGZpbGUsICBiZWZvcmUgcmVwbGFjZSB0aGUgQ1NTIHJ1bGUsIHdlIGhhdmUgdG8gZGVyaXZlIHRoZSByZWxhdGl2ZVxuICAgICAgICAvLyBwYXRoIGJldHdlZW4gdGhlbS5cbiAgICAgICAgLy9cbiAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICBwYXRoLmRpcm5hbWUoY3NzRmlsZVBhdGgpLFxuICAgICAgICAgIHNhdmVEaXJQYXRoXG4gICAgICAgICk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gUmVwbGFjZSBDU1MgcnVsZSB3aXRoIGV2ZXJ5IGZvbnQgdGhhdCBkb3dubG9hZGVkLlxuICAgICAgICAvL1xuICAgICAgICBqb2JzLm1hcChqb2IgPT4ge1xuICAgICAgICAgIGRlY2wudmFsdWUgPSBkZWNsLnZhbHVlLnJlcGxhY2UoXG4gICAgICAgICAgICBqb2IudXJsLFxuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gUmVwbGFjZSBgXFxcXGAgdG8gYC9gIGZvciBXaW5kb3dzIGNvbXBhdGliaWxpdHkuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgcGF0aC5qb2luKHJlbGF0aXZlUGF0aCwgam9iLmZpbGVuYW1lKS5yZXBsYWNlKC9cXFxcL2csICcvJylcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBkb3dubG9hZGVyXG4gICAqL1xuICBzdGF0aWMgc2V0RG93bmxvYWRlciAoZG93bmxvYWRlcikge1xuICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkZXIgPSBkb3dubG9hZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEByZXR1cm5zIHtEb3dubG9hZGVyfVxuICAgKi9cbiAgc3RhdGljIGdldERvd25sb2FkZXIgKCkge1xuICAgIHJldHVybiBGb250R3JhYmJlci5kb3dubG9hZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIE1ha2UgaGFuZGxlIGZ1bmN0aW9uIGZvciBwbHVnaW4gdG8gY2FsbCB3aXRoLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0c1xuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICBzdGF0aWMgbWFrZVBsdWdpbkhhbmRsZXIgKG9wdHMgPSB7fSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoY3NzLCByZXN1bHQpIHtcbiAgICAgIC8vXG4gICAgICAvLyBHZXQgdGhlIG9wdGlvbnMgZnJvbSBQb3N0Y3NzIGZvciBsYXRlciB1c2UuXG4gICAgICAvL1xuICAgICAgbGV0IHBvc3Rjc3NPcHRzID0gcmVzdWx0Lm9wdHM7XG5cbiAgICAgIC8vXG4gICAgICAvLyBJZiBzb21ldGhpbmcgaXMgbWlzc2luZyBpbiB0aGUgUG9zdGNzcyBvcHRpb25zLCB0aHJvdyBhbiBFcnJvci5cbiAgICAgIC8vXG4gICAgICBGb250R3JhYmJlci52YWxpZGF0ZVBvc3Rjc3NPcHRpb25zKHBvc3Rjc3NPcHRzKTtcblxuICAgICAgLy9cbiAgICAgIC8vIFJldmlldyBvcHRpb25zIGZvciBGb250IEdyYWJiZXIgKFRoaXMgbWF5IG1vZGlmeSB0aGVtKS5cbiAgICAgIC8vXG4gICAgICBGb250R3JhYmJlci5yZXZpZXdPcHRpb25zKG9wdHMsIHBvc3Rjc3NPcHRzKTtcblxuICAgICAgLy9cbiAgICAgIC8vIFByb2Nlc3MgZXZlcnkgRGVjbGFyYXRpb24gdGhhdCBtYXRjaHMgcnVsZSBgZm9udC1mYWNlYCBjb25jdXJyZW50bHkuXG4gICAgICAvL1xuICAgICAgbGV0IHByb2Nlc3NQcm9taXNlcyA9IFtdO1xuXG4gICAgICBjb25zdCBkZWNsYXJhdGlvblByb2Nlc3NvciA9IChkZWNsKSA9PiB7XG4gICAgICAgIGlmIChGb250R3JhYmJlci5zaG91bGRQcm9jZXNzVGhpc0ZvbnRGYWNlRGVjbGFyYXRpb24oZGVjbCkpIHtcbiAgICAgICAgICBwcm9jZXNzUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkRm9udEFuZFVwZGF0ZURlY2xhcmF0aW9uKGRlY2wsIG9wdHMuZGlyUGF0aCwgcG9zdGNzc09wdHMudG8pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY3NzLndhbGtBdFJ1bGVzKC9mb250LWZhY2UvLCBGb250R3JhYmJlci5pdGVyYXRlQ1NTUnVsZVdpdGgoZGVjbGFyYXRpb25Qcm9jZXNzb3IpKTtcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgcHJvY2Vzc1Byb21pc2VzLmxlbmd0aCA9PT0gMCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5hbGwocHJvY2Vzc1Byb21pc2VzKVxuICAgICAgKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEZvbnRHcmFiYmVyOyJdfQ==