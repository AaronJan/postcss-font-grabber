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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZm9udC1ncmFiYmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVksTzs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7OztJQU1NLFc7Ozs7Ozs7Ozs7Ozs7MkNBVTJCLFcsRUFBYTtBQUMxQyxVQUFJLENBQUUsWUFBWSxJQUFsQixFQUF3QjtBQUN0QixjQUFNLElBQUksS0FBSixDQUFVLHNEQUFWLENBQU47QUFDRDtBQUNELFVBQUksQ0FBRSxZQUFZLEVBQWxCLEVBQXNCO0FBQ3BCLGNBQU0sSUFBSSxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEO0FBQ0Y7Ozs7Ozs7Ozs7Ozs7O3VDQU8wQixRLEVBQVU7QUFDbkMsYUFBTyxVQUFDLElBQUQsRUFBVTtBQUNmLGFBQUssSUFBTCxDQUFVLFFBQVY7QUFDRCxPQUZEO0FBR0Q7Ozs7Ozs7Ozs7NkNBT2dDLEcsRUFBSztBQUNwQyxVQUFNLFNBQVMsUUFBUSw4QkFBUixDQUF1QyxJQUF2QyxDQUE0QyxHQUE1QyxDQUFmOztBQUVBLGFBQ0UsV0FBVyxJQUFYLEdBQ0UsSUFERixHQUVFLGNBQUksS0FBSixDQUFVLE9BQU8sQ0FBUCxDQUFWLENBSEo7QUFLRDs7Ozs7Ozs7Ozs7d0RBUTJDLEksRUFBTSxLLEVBQU87QUFDdkQsVUFDRSxTQUNBLFFBQVEsdUJBQVIsQ0FBZ0MsSUFBaEMsQ0FBcUMsTUFBTSxRQUEzQyxDQURBLElBRUMsQ0FBRSx3QkFBUyxJQUFULEVBQWUsS0FBZixDQUhMLEVBSUU7QUFDQSxhQUFLLElBQUwsQ0FBVSxLQUFWO0FBQ0Q7O0FBRUQsYUFBTyxJQUFQO0FBQ0Q7Ozs7Ozs7Ozs7a0RBT3FDLFcsRUFBYTtBQUNqRCxhQUFPLFVBQUMsVUFBRCxFQUFnQjtBQUNyQixZQUFNLFdBQVcsV0FBVyxRQUFYLENBQW9CLEtBQXBCLENBQTBCLEdBQTFCLEVBQStCLEdBQS9CLEVBQWpCOztBQUVBLGVBQU87QUFD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OztBQUtBLG9CQUFZLGFBQVosQ0FBMEIsSUFBMUIsRUFBZ0MsV0FBaEM7Ozs7O0FBS0EsWUFBSSxrQkFBa0IsRUFBdEI7O0FBRUEsWUFBTSx1QkFBdUIsU0FBdkIsb0JBQXVCLENBQUMsSUFBRCxFQUFVO0FBQ3JDLGNBQUksWUFBWSxvQ0FBWixDQUFpRCxJQUFqRCxDQUFKLEVBQTREO0FBQzFELDRCQUFnQixJQUFoQixDQUNFLFlBQVksZ0NBQVosQ0FBNkMsSUFBN0MsRUFBbUQsS0FBSyxPQUF4RCxFQUFpRSxZQUFZLEVBQTdFLENBREY7QUFHRDtBQUNGLFNBTkQ7O0FBUUEsWUFBSSxXQUFKLENBQWdCLFdBQWhCLEVBQTZCLFlBQVksa0JBQVosQ0FBK0Isb0JBQS9CLENBQTdCOztBQUVBLGVBQ0UsZ0JBQWdCLE1BQWhCLEtBQTJCLENBQTNCLEdBQ0UsUUFBUSxPQUFSLEVBREYsR0FFRSxRQUFRLEdBQVIsQ0FBWSxlQUFaLENBSEo7QUFLRCxPQXBDRDtBQXFDRDs7Ozs7O0FBNVFHLFcsQ0FJRyxVLEdBQWEsMEI7a0JBMlFQLFciLCJmaWxlIjoiZm9udC1ncmFiYmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcbmltcG9ydCBEb3dubG9hZGVyIGZyb20gJy4vZG93bmxvYWRlcic7XG5pbXBvcnQgKiBhcyByZWdleGVzIGZyb20gJy4vcmVnZXhlcyc7XG5pbXBvcnQgaW5jbHVkZXMgZnJvbSAnbG9kYXNoL2ZwL2luY2x1ZGVzJztcblxuXG4vKipcbiAqIFRoZSBGb250IEdyYWJiZXIuXG4gKi9cbmNsYXNzIEZvbnRHcmFiYmVyIHtcbiAgLyoqXG4gICAqXG4gICAqL1xuICBzdGF0aWMgZG93bmxvYWRlciA9IG5ldyBEb3dubG9hZGVyKCk7XG4gIFxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHBvc3Rjc3NPcHRzXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVQb3N0Y3NzT3B0aW9ucyAocG9zdGNzc09wdHMpIHtcbiAgICBpZiAoISBwb3N0Y3NzT3B0cy5mcm9tKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyIHJlcXVpcmVzIHBvc3Rjc3MgXCJmcm9tXCIgb3B0aW9uLicpO1xuICAgIH1cbiAgICBpZiAoISBwb3N0Y3NzT3B0cy50bykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb3N0Y3NzLWZvbnQtZ3JhYmJlciByZXF1aXJlcyBwb3N0Y3NzIFwidG9cIiBvcHRpb24uJyk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGl0ZXJhdG9yXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxuICAgKi9cbiAgc3RhdGljIGl0ZXJhdGVDU1NSdWxlV2l0aCAoaXRlcmF0b3IpIHtcbiAgICByZXR1cm4gKHJ1bGUpID0+IHtcbiAgICAgIHJ1bGUuZWFjaChpdGVyYXRvcik7XG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBzcmNcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzdGF0aWMgZ2VuZXJhdGVVcmxPYmplY3RGcm9tU3JjIChzcmMpIHtcbiAgICBjb25zdCByZXN1bHQgPSByZWdleGVzLmV4dHJhY3RVcmxGcm9tRm9udEZhY2VTcmNSZWdleC5leGVjKHNyYyk7XG4gICAgXG4gICAgcmV0dXJuIChcbiAgICAgIHJlc3VsdCA9PT0gbnVsbCA/XG4gICAgICAgIG51bGwgOlxuICAgICAgICB1cmwucGFyc2UocmVzdWx0WzFdKVxuICAgICk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ga2VwdFxuICAgKiBAcGFyYW0gdmFsdWVcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzdGF0aWMga2VlcFVuaXF1ZUFuZFZhbGlkRm9udEZpbGVVcmxPYmplY3QgKGtlcHQsIHZhbHVlKSB7XG4gICAgaWYgKFxuICAgICAgdmFsdWUgJiZcbiAgICAgIHJlZ2V4ZXMudmFsaWRGb250RXh0ZW5zaW9uUmVnZXgudGVzdCh2YWx1ZS5wYXRobmFtZSkgJiZcbiAgICAgICghIGluY2x1ZGVzKGtlcHQsIHZhbHVlKSlcbiAgICApIHtcbiAgICAgIGtlcHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBrZXB0O1xuICB9XG4gIFxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGRvd25sb2FkRGlyXG4gICAqIEByZXR1cm5zIHtmdW5jdGlvbigpfVxuICAgKi9cbiAgc3RhdGljIG1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyIChkb3dubG9hZERpcikge1xuICAgIHJldHVybiAoZm9udFVybE9iaikgPT4ge1xuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmb250VXJsT2JqLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybCAgICAgOiBmb250VXJsT2JqLmhyZWYsXG4gICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgcHJvbWlzZSA6IEZvbnRHcmFiYmVyLmRvd25sb2FkZXIuZG93bmxvYWQoXG4gICAgICAgICAgZm9udFVybE9iaixcbiAgICAgICAgICBwYXRoLmpvaW4oZG93bmxvYWREaXIsIGZpbGVuYW1lKVxuICAgICAgICApLFxuICAgICAgfTtcbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIG9wdHNcbiAgICogQHBhcmFtIHBvc3Rjc3NPcHRzXG4gICAqL1xuICBzdGF0aWMgcmV2aWV3T3B0aW9ucyAob3B0cywgcG9zdGNzc09wdHMpIHtcbiAgICBpZiAoISBvcHRzLmRpclBhdGgpIHtcbiAgICAgIG9wdHMuZGlyUGF0aCA9IHBhdGguZGlybmFtZShwb3N0Y3NzT3B0cy50byk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2tpcCBGb250LUZhY2UgUG9zdGNzcyBvYmplY3QgdGhhdCBpczpcbiAgICogICBub3QgYSBEZWNsYXJhdGlvblxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiBgc3JjYCBwcm9wZXJ0eVxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiByZW1vdGUgZm9udCBmaWxlXG4gICAqXG4gICAqIEBwYXJhbSBkZWNsXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgc3RhdGljIHNob3VsZFByb2Nlc3NUaGlzRm9udEZhY2VEZWNsYXJhdGlvbiAoZGVjbCkge1xuICAgIGlmIChkZWNsLnR5cGUgIT09ICdkZWNsJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZGVjbC5wcm9wICE9PSAnc3JjJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocmVnZXhlcy5pc0ZvbnRGYWNlU3JjQ29udGFpbnNSZW1vdGVGb250VXJsUmVnZXgudGVzdChkZWNsLnZhbHVlKSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gdXJsU3JjU291cmNlc1xuICAgKiBAcGFyYW0gc3JjU291cmNlXG4gICAqIEByZXR1cm5zIHtBcnJheX1cbiAgICovXG4gIHN0YXRpYyBrZWVwVXJsU3JjU291cmNlT25seSAodXJsU3JjU291cmNlcywgc3JjU291cmNlKSB7XG4gICAgcmV0dXJuIHJlZ2V4ZXMuaXNSZW1vdGVGb250VXJsUmVnZXgudGVzdChzcmNTb3VyY2UpID9cbiAgICAgIFsuLi51cmxTcmNTb3VyY2VzLCBzcmNTb3VyY2VdIDpcbiAgICAgIHVybFNyY1NvdXJjZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEb3dubG9hZCBmb250IGZpbGUgYW5kIHVwZGF0ZSBvdXRwdXQgQ1NTIHJ1bGUgY29ycmVzcG9uZGluZ2x5LlxuICAgKlxuICAgKiBAcGFyYW0gZGVjbCBQb3N0Y3NzIERlY2xhcmF0aW9uIG9iamVjdC5cbiAgICogQHBhcmFtIHNhdmVEaXJQYXRoXG4gICAqIEBwYXJhbSBjc3NGaWxlUGF0aFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHN0YXRpYyBkb3dubG9hZEZvbnRBbmRVcGRhdGVEZWNsYXJhdGlvbiAoZGVjbCwgc2F2ZURpclBhdGgsIGNzc0ZpbGVQYXRoKSB7XG4gICAgLy9cbiAgICAvLyBUaGlzIHdpbGwgYmUgdXNlZCB0byBjYWxjdWxhdGUgcmVsYXRpdmUgcGF0aC5cbiAgICAvL1xuICAgIGNvbnN0IGNzc0ZpbGVEaXJQYXRoID0gcGF0aC5kaXJuYW1lKGNzc0ZpbGVQYXRoKTtcblxuICAgIC8vXG4gICAgLy8gT25lIHNyYyBjb3VsZCBoYXZlIG11bHRpcGxlIGBzb3VyY2VgLCB0aGV5IGFyZSBzZXBhcmF0ZWQgd2l0aCBgLGAsXG4gICAgLy8gc28gYnJlYWsgaXQgZG93biBhbmQgZmlsdGVyIG91dCB0aG9zZSB3aGljaCBpc24ndCBhbiBgdXJsYCBzb3VyY2UuXG4gICAgLy9cbiAgICBjb25zdCB1cmxTcmNTb3VyY2VzID0gZGVjbC52YWx1ZVxuICAgICAgLnNwbGl0KCcsJylcbiAgICAgIC5tYXAoZnVuY3Rpb24gdHJpbSAoc3JjU291cmNlcykge1xuICAgICAgICByZXR1cm4gc3JjU291cmNlcy5yZXBsYWNlKHJlZ2V4ZXMudHJpbVJlZ2V4LCAnJyk7XG4gICAgICB9KVxuICAgICAgLnJlZHVjZShGb250R3JhYmJlci5rZWVwVXJsU3JjU291cmNlT25seSwgW10pO1xuXG4gICAgLy9cbiAgICAvLyBVc2UgYHVybFNyY1NvdXJjZXNgIHRvIGdlbmVyYXRlIFVybCBvYmplY3RzIGZvciBkb3dubG9hZC5cbiAgICAvLyBUaGlzIHdpbGwgY2hlY2sgdGhlIHZhbGlkYXRpb24gb2YgZm9udCB1cmwsIGFuZCBvbmx5IGtlZXAgd2hpY2ggaXNcbiAgICAvLyB1bmlxdWUuXG4gICAgY29uc3QgZm9udEZpbGVVcmxPYmplY3RzID0gdXJsU3JjU291cmNlc1xuICAgICAgLm1hcChGb250R3JhYmJlci5nZW5lcmF0ZVVybE9iamVjdEZyb21TcmMpXG4gICAgICAucmVkdWNlKEZvbnRHcmFiYmVyLmtlZXBVbmlxdWVBbmRWYWxpZEZvbnRGaWxlVXJsT2JqZWN0LCBbXSk7XG4gICAgXG4gICAgLy9cbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb250IGZpbGUgbmVlZHMgdG8gYmUgZG93bmxvYWQsIGVuZCB0aGlzIGZ1bmN0aW9uXG4gICAgLy8gTXVzdCByZXR1cm4gYSBwcm9taXNlLlxuICAgIC8vXG4gICAgaWYgKGZvbnRGaWxlVXJsT2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgXG4gICAgLy9cbiAgICAvLyBEb3dubG9hZCBmb250IHRvIGBzYXZlRGlyUGF0aGAgdXNpbmcgVXJsIG9iamVjdHMgKipjb25jdXJyZW50bHkqKlxuICAgIC8vIGFuZCByZXR1cm4gYGpvYmAgb2JqZWN0cyB0aGF0IGNvbnRhaW46XG4gICAgLy9cbiAgICAvLyAgIHVybDogdGhlIGZ1bGwgdXJsIG5lZWRzIHRvIGJlIHJlcGxhY2VkXG4gICAgLy8gICBmaWxlbmFtZTogdGhlIG5hbWUgb2YgdGhlIHNhdmVkIGZpbGVcbiAgICAvLyAgIHByb21pc2U6IGEgcHJvbWlzZSB3aWxsIGJlIGZ1bGZpbGxlZCB3aGVuIGRvd25sb2FkIGNvbXBsZXRlZFxuICAgIC8vXG4gICAgY29uc3Qgam9icyA9IGZvbnRGaWxlVXJsT2JqZWN0cy5tYXAoXG4gICAgICBGb250R3JhYmJlci5tYWtlRm9udERvd25sb2FkSm9iRGlzcGF0Y2hlcihzYXZlRGlyUGF0aClcbiAgICApO1xuICAgIFxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2JzLm1hcChqb2IgPT4gam9iLnByb21pc2UpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgZm9udCBmaWxlIG1pZ2h0IGJlIHNhdmVkIGluIGEgZGlmZmVyZW50IGRpcmVjdG9yeSB0byB0aGUgQ1NTXG4gICAgICAgIC8vIGZpbGUsIGJlZm9yZSByZXBsYWNlIHRoZSBDU1MgcnVsZSwgd2UgaGF2ZSB0byBkZXJpdmUgdGhlIHJlbGF0aXZlXG4gICAgICAgIC8vIHBhdGggYmV0d2VlbiB0aGVtLlxuICAgICAgICAvL1xuICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKFxuICAgICAgICAgIGNzc0ZpbGVEaXJQYXRoLFxuICAgICAgICAgIHNhdmVEaXJQYXRoXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICAvL1xuICAgICAgICAvLyBSZXBsYWNlIENTUyBydWxlIHdpdGggZXZlcnkgZm9udCB0aGF0IGRvd25sb2FkZWQuXG4gICAgICAgIC8vXG4gICAgICAgIGpvYnMubWFwKGpvYiA9PiB7XG4gICAgICAgICAgZGVjbC52YWx1ZSA9IGRlY2wudmFsdWUucmVwbGFjZShcbiAgICAgICAgICAgIGpvYi51cmwsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBSZXBsYWNlIGBcXFxcYCB0byBgL2AgZm9yIFdpbmRvd3MgY29tcGF0aWJpbGl0eS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICBwYXRoLmpvaW4ocmVsYXRpdmVQYXRoLCBqb2IuZmlsZW5hbWUpLnJlcGxhY2UoL1xcXFwvZywgJy8nKVxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZG93bmxvYWRlclxuICAgKi9cbiAgc3RhdGljIHNldERvd25sb2FkZXIgKGRvd25sb2FkZXIpIHtcbiAgICBGb250R3JhYmJlci5kb3dubG9hZGVyID0gZG93bmxvYWRlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqXG4gICAqIEByZXR1cm5zIHtEb3dubG9hZGVyfVxuICAgKi9cbiAgc3RhdGljIGdldERvd25sb2FkZXIgKCkge1xuICAgIHJldHVybiBGb250R3JhYmJlci5kb3dubG9hZGVyO1xuICB9XG4gIFxuICAvKipcbiAgICogTWFrZSBoYW5kbGUgZnVuY3Rpb24gZm9yIHBsdWdpbiB0byBjYWxsIHdpdGguXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAgICovXG4gIHN0YXRpYyBtYWtlUGx1Z2luSGFuZGxlciAob3B0cyA9IHt9KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjc3MsIHJlc3VsdCkge1xuICAgICAgLy9cbiAgICAgIC8vIEdldCB0aGUgb3B0aW9ucyBmcm9tIFBvc3Rjc3MgZm9yIGxhdGVyIHVzZS5cbiAgICAgIC8vXG4gICAgICBsZXQgcG9zdGNzc09wdHMgPSByZXN1bHQub3B0cztcbiAgICAgIFxuICAgICAgLy9cbiAgICAgIC8vIElmIHNvbWV0aGluZyBpcyBtaXNzaW5nIGluIHRoZSBQb3N0Y3NzIG9wdGlvbnMsIHRocm93IGFuIEVycm9yLlxuICAgICAgLy9cbiAgICAgIEZvbnRHcmFiYmVyLnZhbGlkYXRlUG9zdGNzc09wdGlvbnMocG9zdGNzc09wdHMpO1xuICAgICAgXG4gICAgICAvL1xuICAgICAgLy8gUmV2aWV3IG9wdGlvbnMgZm9yIEZvbnQgR3JhYmJlciAoVGhpcyBtYXkgbW9kaWZ5IHRoZW0pLlxuICAgICAgLy9cbiAgICAgIEZvbnRHcmFiYmVyLnJldmlld09wdGlvbnMob3B0cywgcG9zdGNzc09wdHMpO1xuICAgICAgXG4gICAgICAvL1xuICAgICAgLy8gUHJvY2VzcyBldmVyeSBEZWNsYXJhdGlvbiB0aGF0IG1hdGNocyBydWxlIGBmb250LWZhY2VgIGNvbmN1cnJlbnRseS5cbiAgICAgIC8vXG4gICAgICBsZXQgcHJvY2Vzc1Byb21pc2VzID0gW107XG4gICAgICBcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uUHJvY2Vzc29yID0gKGRlY2wpID0+IHtcbiAgICAgICAgaWYgKEZvbnRHcmFiYmVyLnNob3VsZFByb2Nlc3NUaGlzRm9udEZhY2VEZWNsYXJhdGlvbihkZWNsKSkge1xuICAgICAgICAgIHByb2Nlc3NQcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgRm9udEdyYWJiZXIuZG93bmxvYWRGb250QW5kVXBkYXRlRGVjbGFyYXRpb24oZGVjbCwgb3B0cy5kaXJQYXRoLCBwb3N0Y3NzT3B0cy50bylcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICBjc3Mud2Fsa0F0UnVsZXMoL2ZvbnQtZmFjZS8sIEZvbnRHcmFiYmVyLml0ZXJhdGVDU1NSdWxlV2l0aChkZWNsYXJhdGlvblByb2Nlc3NvcikpO1xuICAgICAgXG4gICAgICByZXR1cm4gKFxuICAgICAgICBwcm9jZXNzUHJvbWlzZXMubGVuZ3RoID09PSAwID9cbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKSA6XG4gICAgICAgICAgUHJvbWlzZS5hbGwocHJvY2Vzc1Byb21pc2VzKVxuICAgICAgKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEZvbnRHcmFiYmVyOyJdfQ==