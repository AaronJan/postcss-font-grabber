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
      // This will be used to calculate relative path.
      //
      var cssFileDirPath = _path2.default.dirname(cssFilePath);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZm9udC1ncmFiYmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVksTzs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7SUFNTSxXOzs7Ozs7Ozs7Ozs7OzJDQVUyQixXLEVBQWE7QUFDMUMsVUFBSSxDQUFFLFlBQVksSUFBbEIsRUFBd0I7QUFDdEIsY0FBTSxJQUFJLEtBQUosQ0FBVSxzREFBVixDQUFOO0FBQ0Q7QUFDRCxVQUFJLENBQUUsWUFBWSxFQUFsQixFQUFzQjtBQUNwQixjQUFNLElBQUksS0FBSixDQUFVLG9EQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7Ozs7Ozs7Ozt1Q0FPMEIsUSxFQUFVO0FBQ25DLGFBQU8sVUFBQyxJQUFELEVBQVU7QUFDZixhQUFLLElBQUwsQ0FBVSxRQUFWO0FBQ0QsT0FGRDtBQUdEOzs7Ozs7Ozs7OzZDQU9nQyxHLEVBQUs7QUFDcEMsVUFBTSxTQUFTLFFBQVEsOEJBQVIsQ0FBdUMsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBZjs7QUFFQSxhQUNFLFdBQVcsSUFBWCxHQUNBLElBREEsR0FFQSxjQUFJLEtBQUosQ0FBVSxPQUFPLENBQVAsQ0FBVixDQUhGO0FBS0Q7Ozs7Ozs7Ozs7O3dEQVEyQyxJLEVBQU0sSyxFQUFPO0FBQ3ZELFVBQ0UsU0FDQSxRQUFRLHVCQUFSLENBQWdDLElBQWhDLENBQXFDLE1BQU0sUUFBM0MsQ0FEQSxJQUVDLENBQUUsd0JBQVMsSUFBVCxFQUFlLEtBQWYsQ0FITCxFQUlFO0FBQ0EsYUFBSyxJQUFMLENBQVUsS0FBVjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7O2tEQU9xQyxXLEVBQWE7QUFDakQsYUFBTyxVQUFDLFVBQUQsRUFBZ0I7QUFDckIsWUFBTSxXQUFXLFdBQVcsUUFBWCxDQUFvQixLQUFwQixDQUEwQixHQUExQixFQUErQixHQUEvQixFQUFqQjs7QUFFQSxlQUFPO0FBQ0ws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QUFaLENBQTZDLElBQTdDLEVBQW1ELEtBQUssT0FBeEQsRUFBaUUsWUFBWSxFQUE3RSxDQURGO0FBR0Q7QUFDRixTQU5EOztBQVFBLFlBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QixZQUFZLGtCQUFaLENBQStCLG9CQUEvQixDQUE3Qjs7QUFFQSxlQUNFLGdCQUFnQixNQUFoQixLQUEyQixDQUEzQixHQUNBLFFBQVEsT0FBUixFQURBLEdBRUEsUUFBUSxHQUFSLENBQVksZUFBWixDQUhGO0FBS0QsT0FwQ0Q7QUFxQ0Q7Ozs7OztBQTVQRyxXLENBSUcsVSxHQUFhLDBCO2tCQTJQUCxXIiwiZmlsZSI6ImZvbnQtZ3JhYmJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgRG93bmxvYWRlciBmcm9tICcuL2Rvd25sb2FkZXInO1xuaW1wb3J0ICogYXMgcmVnZXhlcyBmcm9tICcuL3JlZ2V4ZXMnO1xuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2xvZGFzaC9mcC9pbmNsdWRlcyc7XG5cblxuLyoqXG4gKiBUaGUgRm9udCBHcmFiYmVyLlxuICovXG5jbGFzcyBGb250R3JhYmJlciB7XG4gIC8qKlxuICAgKlxuICAgKi9cbiAgc3RhdGljIGRvd25sb2FkZXIgPSBuZXcgRG93bmxvYWRlcigpO1xuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZVBvc3Rjc3NPcHRpb25zIChwb3N0Y3NzT3B0cykge1xuICAgIGlmICghIHBvc3Rjc3NPcHRzLmZyb20pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncG9zdGNzcy1mb250LWdyYWJiZXIgcmVxdWlyZXMgcG9zdGNzcyBcImZyb21cIiBvcHRpb24uJyk7XG4gICAgfVxuICAgIGlmICghIHBvc3Rjc3NPcHRzLnRvKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyIHJlcXVpcmVzIHBvc3Rjc3MgXCJ0b1wiIG9wdGlvbi4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGl0ZXJhdG9yXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxuICAgKi9cbiAgc3RhdGljIGl0ZXJhdGVDU1NSdWxlV2l0aCAoaXRlcmF0b3IpIHtcbiAgICByZXR1cm4gKHJ1bGUpID0+IHtcbiAgICAgIHJ1bGUuZWFjaChpdGVyYXRvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gc3JjXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgc3RhdGljIGdlbmVyYXRlVXJsT2JqZWN0RnJvbVNyYyAoc3JjKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gcmVnZXhlcy5leHRyYWN0VXJsRnJvbUZvbnRGYWNlU3JjUmVnZXguZXhlYyhzcmMpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIHJlc3VsdCA9PT0gbnVsbCA/XG4gICAgICBudWxsIDpcbiAgICAgIHVybC5wYXJzZShyZXN1bHRbMl0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ga2VwdFxuICAgKiBAcGFyYW0gdmFsdWVcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzdGF0aWMga2VlcFVuaXF1ZUFuZFZhbGlkRm9udEZpbGVVcmxPYmplY3QgKGtlcHQsIHZhbHVlKSB7XG4gICAgaWYgKFxuICAgICAgdmFsdWUgJiZcbiAgICAgIHJlZ2V4ZXMudmFsaWRGb250RXh0ZW5zaW9uUmVnZXgudGVzdCh2YWx1ZS5wYXRobmFtZSkgJiZcbiAgICAgICghIGluY2x1ZGVzKGtlcHQsIHZhbHVlKSlcbiAgICApIHtcbiAgICAgIGtlcHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtlcHQ7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGRvd25sb2FkRGlyXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxuICAgKi9cbiAgc3RhdGljIG1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyIChkb3dubG9hZERpcikge1xuICAgIHJldHVybiAoZm9udFVybE9iaikgPT4ge1xuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmb250VXJsT2JqLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybCAgICAgOiBmb250VXJsT2JqLmhyZWYsXG4gICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgcHJvbWlzZSA6IEZvbnRHcmFiYmVyLmRvd25sb2FkZXIuZG93bmxvYWQoXG4gICAgICAgICAgZm9udFVybE9iaixcbiAgICAgICAgICBwYXRoLmpvaW4oZG93bmxvYWREaXIsIGZpbGVuYW1lKVxuICAgICAgICApLFxuICAgICAgfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzXG4gICAqIEBwYXJhbSBwb3N0Y3NzT3B0c1xuICAgKi9cbiAgc3RhdGljIHJldmlld09wdGlvbnMgKG9wdHMsIHBvc3Rjc3NPcHRzKSB7XG4gICAgaWYgKCEgb3B0cy5kaXJQYXRoKSB7XG4gICAgICBvcHRzLmRpclBhdGggPSBwYXRoLmRpcm5hbWUocG9zdGNzc09wdHMudG8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTa2lwIEZvbnQtRmFjZSBQb3N0Y3NzIG9iamVjdCB0aGF0IGlzOlxuICAgKiAgIG5vdCBhIERlY2xhcmF0aW9uXG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIGBzcmNgIHByb3BlcnR5XG4gICAqICAgb3IgZG9lc24ndCBjb250YWluIHJlbW90ZSBmb250IGZpbGVcbiAgICpcbiAgICogQHBhcmFtIGRlY2xcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uIChkZWNsKSB7XG4gICAgaWYgKGRlY2wudHlwZSAhPT0gJ2RlY2wnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChkZWNsLnByb3AgIT09ICdzcmMnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChyZWdleGVzLmlzRm9udEZhY2VTcmNDb250YWluc1JlbW90ZVVybFJlZ2V4LnRlc3QoZGVjbC52YWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogRG93bmxvYWQgZm9udCBmaWxlIGFuZCB1cGRhdGUgb3V0cHV0IENTUyBydWxlIGNvcnJlc3BvbmRpbmdseS5cbiAgICpcbiAgICogQHBhcmFtIGRlY2wgUG9zdGNzcyBEZWNsYXJhdGlvbiBvYmplY3QuXG4gICAqIEBwYXJhbSBzYXZlRGlyUGF0aFxuICAgKiBAcGFyYW0gY3NzRmlsZVBhdGhcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBzdGF0aWMgZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24gKGRlY2wsIHNhdmVEaXJQYXRoLCBjc3NGaWxlUGF0aCkge1xuICAgIC8vXG4gICAgLy8gVGhpcyB3aWxsIGJlIHVzZWQgdG8gY2FsY3VsYXRlIHJlbGF0aXZlIHBhdGguXG4gICAgLy9cbiAgICBjb25zdCBjc3NGaWxlRGlyUGF0aCA9IHBhdGguZGlybmFtZShjc3NGaWxlUGF0aCk7XG5cbiAgICAvL1xuICAgIC8vIE9uZSBzcmMgY291bGQgaGF2ZSBtdWx0aXBsZSBgdXJsKClgLCB0aGV5IGFyZSBzZXBhcmF0ZWQgd2l0aCBgLGAuXG4gICAgLy9cbiAgICBjb25zdCBzcmNVcmxzID0gZGVjbC52YWx1ZVxuICAgICAgLnNwbGl0KCcsJylcbiAgICAgIC5tYXAodmFsdWUgPT4gdmFsdWUucmVwbGFjZShyZWdleGVzLnRyaW1SZWdleCwgJycpKTtcblxuICAgIC8vXG4gICAgLy8gVXNlIGBzcmNVcmxzYCB0byBnZW5lcmF0ZSBVcmwgb2JqZWN0cyBmb3IgZG93bmxvYWQuXG4gICAgLy8gVGhpcyB3aWxsIGNoZWNrIHRoZSB2YWxpZGF0aW9uIG9mIGZvbnQgdXJsLCBhbmQgb25seSBrZWVwIHdoaWNoIGlzXG4gICAgLy8gdW5pcXVlLlxuICAgIGNvbnN0IGZvbnRGaWxlVXJsT2JqZWN0cyA9IHNyY1VybHNcbiAgICAgIC5tYXAoRm9udEdyYWJiZXIuZ2VuZXJhdGVVcmxPYmplY3RGcm9tU3JjKVxuICAgICAgLnJlZHVjZShGb250R3JhYmJlci5rZWVwVW5pcXVlQW5kVmFsaWRGb250RmlsZVVybE9iamVjdCwgW10pO1xuXG4gICAgLy9cbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb250IGZpbGUgbmVlZHMgdG8gYmUgZG93bmxvYWQsIGVuZCB0aGlzIGZ1bmN0aW9uXG4gICAgLy8gTXVzdCByZXR1cm4gYSBwcm9taXNlLlxuICAgIC8vXG4gICAgaWYgKGZvbnRGaWxlVXJsT2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIERvd25sb2FkIGZvbnQgdG8gYHNhdmVEaXJQYXRoYCB1c2luZyBVcmwgb2JqZWN0cyAqKmNvbmN1cnJlbnRseSoqXG4gICAgLy8gYW5kIHJldHVybiBgam9iYCBvYmplY3RzIHRoYXQgY29udGFpbjpcbiAgICAvL1xuICAgIC8vICAgdXJsOiB0aGUgZnVsbCB1cmwgbmVlZHMgdG8gYmUgcmVwbGFjZWRcbiAgICAvLyAgIGZpbGVuYW1lOiB0aGUgbmFtZSBvZiB0aGUgc2F2ZWQgZmlsZVxuICAgIC8vICAgcHJvbWlzZTogYSBwcm9taXNlIHdpbGwgYmUgZnVsZmlsbGVkIHdoZW4gZG93bmxvYWQgY29tcGxldGVkXG4gICAgLy9cbiAgICBjb25zdCBqb2JzID0gZm9udEZpbGVVcmxPYmplY3RzLm1hcChcbiAgICAgIEZvbnRHcmFiYmVyLm1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyKHNhdmVEaXJQYXRoKVxuICAgICk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9icy5tYXAoam9iID0+IGpvYi5wcm9taXNlKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGZvbnQgZmlsZSBtaWdodCBiZSBzYXZlZCBpbiBhIGRpZmZlcmVudCBkaXJlY3RvcnkgdG8gdGhlIENTU1xuICAgICAgICAvLyBmaWxlLCBiZWZvcmUgcmVwbGFjZSB0aGUgQ1NTIHJ1bGUsIHdlIGhhdmUgdG8gZGVyaXZlIHRoZSByZWxhdGl2ZVxuICAgICAgICAvLyBwYXRoIGJldHdlZW4gdGhlbS5cbiAgICAgICAgLy9cbiAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICBjc3NGaWxlRGlyUGF0aCxcbiAgICAgICAgICBzYXZlRGlyUGF0aFxuICAgICAgICApO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFJlcGxhY2UgQ1NTIHJ1bGUgd2l0aCBldmVyeSBmb250IHRoYXQgZG93bmxvYWRlZC5cbiAgICAgICAgLy9cbiAgICAgICAgam9icy5tYXAoam9iID0+IHtcbiAgICAgICAgICBkZWNsLnZhbHVlID0gZGVjbC52YWx1ZS5yZXBsYWNlKFxuICAgICAgICAgICAgam9iLnVybCxcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFJlcGxhY2UgYFxcXFxgIHRvIGAvYCBmb3IgV2luZG93cyBjb21wYXRpYmlsaXR5LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIHBhdGguam9pbihyZWxhdGl2ZVBhdGgsIGpvYi5maWxlbmFtZSkucmVwbGFjZSgvXFxcXC9nLCAnLycpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZG93bmxvYWRlclxuICAgKi9cbiAgc3RhdGljIHNldERvd25sb2FkZXIgKGRvd25sb2FkZXIpIHtcbiAgICBGb250R3JhYmJlci5kb3dubG9hZGVyID0gZG93bmxvYWRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcmV0dXJucyB7RG93bmxvYWRlcn1cbiAgICovXG4gIHN0YXRpYyBnZXREb3dubG9hZGVyICgpIHtcbiAgICByZXR1cm4gRm9udEdyYWJiZXIuZG93bmxvYWRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIGhhbmRsZSBmdW5jdGlvbiBmb3IgcGx1Z2luIHRvIGNhbGwgd2l0aC5cbiAgICpcbiAgICogQHBhcmFtIG9wdHNcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgKi9cbiAgc3RhdGljIG1ha2VQbHVnaW5IYW5kbGVyIChvcHRzID0ge30pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGNzcywgcmVzdWx0KSB7XG4gICAgICAvL1xuICAgICAgLy8gR2V0IHRoZSBvcHRpb25zIGZyb20gUG9zdGNzcyBmb3IgbGF0ZXIgdXNlLlxuICAgICAgLy9cbiAgICAgIGxldCBwb3N0Y3NzT3B0cyA9IHJlc3VsdC5vcHRzO1xuXG4gICAgICAvL1xuICAgICAgLy8gSWYgc29tZXRoaW5nIGlzIG1pc3NpbmcgaW4gdGhlIFBvc3Rjc3Mgb3B0aW9ucywgdGhyb3cgYW4gRXJyb3IuXG4gICAgICAvL1xuICAgICAgRm9udEdyYWJiZXIudmFsaWRhdGVQb3N0Y3NzT3B0aW9ucyhwb3N0Y3NzT3B0cyk7XG5cbiAgICAgIC8vXG4gICAgICAvLyBSZXZpZXcgb3B0aW9ucyBmb3IgRm9udCBHcmFiYmVyIChUaGlzIG1heSBtb2RpZnkgdGhlbSkuXG4gICAgICAvL1xuICAgICAgRm9udEdyYWJiZXIucmV2aWV3T3B0aW9ucyhvcHRzLCBwb3N0Y3NzT3B0cyk7XG5cbiAgICAgIC8vXG4gICAgICAvLyBQcm9jZXNzIGV2ZXJ5IERlY2xhcmF0aW9uIHRoYXQgbWF0Y2hzIHJ1bGUgYGZvbnQtZmFjZWAgY29uY3VycmVudGx5LlxuICAgICAgLy9cbiAgICAgIGxldCBwcm9jZXNzUHJvbWlzZXMgPSBbXTtcblxuICAgICAgY29uc3QgZGVjbGFyYXRpb25Qcm9jZXNzb3IgPSAoZGVjbCkgPT4ge1xuICAgICAgICBpZiAoRm9udEdyYWJiZXIuc2hvdWxkUHJvY2Vzc1RoaXNGb250RmFjZURlY2xhcmF0aW9uKGRlY2wpKSB7XG4gICAgICAgICAgcHJvY2Vzc1Byb21pc2VzLnB1c2goXG4gICAgICAgICAgICBGb250R3JhYmJlci5kb3dubG9hZEZvbnRBbmRVcGRhdGVEZWNsYXJhdGlvbihkZWNsLCBvcHRzLmRpclBhdGgsIHBvc3Rjc3NPcHRzLnRvKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNzcy53YWxrQXRSdWxlcygvZm9udC1mYWNlLywgRm9udEdyYWJiZXIuaXRlcmF0ZUNTU1J1bGVXaXRoKGRlY2xhcmF0aW9uUHJvY2Vzc29yKSk7XG5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIHByb2Nlc3NQcm9taXNlcy5sZW5ndGggPT09IDAgP1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgIFByb21pc2UuYWxsKHByb2Nlc3NQcm9taXNlcylcbiAgICAgICk7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBGb250R3JhYmJlcjsiXX0=