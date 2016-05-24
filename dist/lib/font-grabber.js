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

FontGrabber.downloader = new _downloader2.default();
exports.default = FontGrabber;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZm9udC1ncmFiYmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVksTzs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7SUFNTSxXOzs7Ozs7Ozs7Ozs7OzJDQVUyQixXLEVBQWE7QUFDMUMsVUFBSSxDQUFFLFlBQVksSUFBbEIsRUFBd0I7QUFDdEIsY0FBTSxJQUFJLEtBQUosQ0FBVSxzREFBVixDQUFOO0FBQ0Q7QUFDRCxVQUFJLENBQUUsWUFBWSxFQUFsQixFQUFzQjtBQUNwQixjQUFNLElBQUksS0FBSixDQUFVLG9EQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7Ozs7Ozs7Ozt1Q0FPMEIsUSxFQUFVO0FBQ25DLGFBQU8sVUFBQyxJQUFELEVBQVU7QUFDZixhQUFLLElBQUwsQ0FBVSxRQUFWO0FBQ0QsT0FGRDtBQUdEOzs7Ozs7Ozs7OzZDQU9nQyxHLEVBQUs7QUFDcEMsVUFBTSxTQUFTLFFBQVEsOEJBQVIsQ0FBdUMsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBZjs7QUFFQSxhQUNFLFdBQVcsSUFBWCxHQUNBLElBREEsR0FFQSxjQUFJLEtBQUosQ0FBVSxPQUFPLENBQVAsQ0FBVixDQUhGO0FBS0Q7Ozs7Ozs7Ozs7O3dEQVEyQyxJLEVBQU0sSyxFQUFPO0FBQ3ZELFVBQ0UsU0FDQSxRQUFRLHVCQUFSLENBQWdDLElBQWhDLENBQXFDLE1BQU0sUUFBM0MsQ0FEQSxJQUVDLENBQUUsd0JBQVMsSUFBVCxFQUFlLEtBQWYsQ0FITCxFQUlFO0FBQ0EsYUFBSyxJQUFMLENBQVUsS0FBVjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7O2tEQU9xQyxXLEVBQWE7QUFDakQsYUFBTyxVQUFDLFVBQUQsRUFBZ0I7QUFDckIsWUFBTSxXQUFXLFdBQVcsUUFBWCxDQUFvQixLQUFwQixDQUEwQixHQUExQixFQUErQixHQUEvQixFQUFqQjs7QUFFQSxlQUFPO0FBQ0wsZUFBVSxXQUFXLElBRGhCO0FBRUwsb0JBQVUsUUFGTDtBQUdMLG1CQUFVLFlBQVksVUFBWixDQUF1QixRQUF2QixDQUNSLFVBRFEsRUFFUixlQUFLLElBQUwsQ0FBVSxXQUFWLEVBQXVCLFFBQXZCLENBRlE7QUFITCxTQUFQO0FBUUQsT0FYRDtBQVlEOzs7Ozs7Ozs7O2tDQU9xQixJLEVBQU0sVyxFQUFhO0FBQ3ZDLFVBQUksQ0FBRSxLQUFLLE9BQVgsRUFBb0I7QUFDbEIsYUFBSyxPQUFMLEdBQWUsZUFBSyxPQUFMLENBQWEsWUFBWSxFQUF6QixDQUFmO0FBQ0Q7QUFDRjs7Ozs7Ozs7Ozs7Ozs7eURBVzRDLEksRUFBTTtBQUNqRCxVQUFJLEtBQUssSUFBTCxLQUFjLE1BQWxCLEVBQTBCO0FBQ3hCLGVBQU8sS0FBUDtBQUNELE9BRkQsTUFFTyxJQUFJLEtBQUssSUFBTCxLQUFjLEtBQWxCLEVBQXlCO0FBQzlCLGVBQU8sS0FBUDtBQUNELE9BRk0sTUFFQSxJQUFJLFFBQVEsbUNBQVIsQ0FBNEMsSUFBNUMsQ0FBaUQsS0FBSyxLQUF0RCxNQUFpRSxLQUFyRSxFQUE0RTtBQUNqRixlQUFPLEtBQVA7QUFDRDs7QUFFRCxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7Ozs7OztxREFVd0MsSSxFQUFNLFcsRUFBYSxXLEVBQWE7Ozs7QUFJdkUsVUFBTSxVQUFVLEtBQUssS0FBTCxDQUNiLEtBRGEsQ0FDUCxHQURPLEVBRWIsR0FGYSxDQUVUO0FBQUEsZUFBUyxNQUFNLE9BQU4sQ0FBYyxRQUFRLFNBQXRCLEVBQWlDLEVBQWpDLENBQVQ7QUFBQSxPQUZTLENBQWhCOzs7Ozs7QUFRQSxVQUFNLHFCQUFxQixRQUN4QixHQUR3QixDQUNwQixZQUFZLHdCQURRLEVBRXhCLE1BRndCLENBRWpCLFlBQVksbUNBRkssRUFFZ0MsRUFGaEMsQ0FBM0I7Ozs7OztBQVFBLFVBQUksbUJBQW1CLE1BQW5CLEtBQThCLENBQWxDLEVBQXFDO0FBQ25DLGVBQU8sUUFBUSxPQUFSLEVBQVA7QUFDRDs7Ozs7Ozs7OztBQVVELFVBQU0sT0FBTyxtQkFBbUIsR0FBbkIsQ0FDWCxZQUFZLDZCQUFaLENBQTBDLFdBQTFDLENBRFcsQ0FBYjs7QUFJQSxhQUFPLFFBQVEsR0FBUixDQUFZLEtBQUssR0FBTCxDQUFTO0FBQUEsZUFBTyxJQUFJLE9BQVg7QUFBQSxPQUFULENBQVosRUFDSixJQURJLENBQ0MsWUFBTTs7Ozs7O0FBTVYsWUFBTSxlQUFlLGVBQUssUUFBTCxDQUNuQixlQUFLLE9BQUwsQ0FBYSxXQUFiLENBRG1CLEVBRW5CLFdBRm1CLENBQXJCOzs7OztBQVFBLGFBQUssR0FBTCxDQUFTLGVBQU87QUFDZCxlQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQ1gsSUFBSSxHQURPOzs7OztBQU1YLHlCQUFLLElBQUwsQ0FBVSxZQUFWLEVBQXdCLElBQUksUUFBNUIsRUFBc0MsT0FBdEMsQ0FBOEMsSUFBOUMsRUFBb0QsR0FBcEQsQ0FOVyxDQUFiO0FBUUQsU0FURDtBQVVELE9BekJJLENBQVA7QUEwQkQ7Ozs7Ozs7OztrQ0FNcUIsVSxFQUFZO0FBQ2hDLGtCQUFZLFVBQVosR0FBeUIsVUFBekI7QUFDRDs7Ozs7Ozs7O29DQU11QjtBQUN0QixhQUFPLFlBQVksVUFBbkI7QUFDRDs7Ozs7Ozs7Ozs7d0NBUW9DO0FBQUEsVUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQ25DLGFBQU8sVUFBVSxHQUFWLEVBQWUsTUFBZixFQUF1Qjs7OztBQUk1QixZQUFJLGNBQWMsT0FBTyxJQUF6Qjs7Ozs7QUFLQSxvQkFBWSxzQkFBWixDQUFtQyxXQUFuQzs7Ozs7QUFLQSxvQkFBWSxhQUFaLENBQTBCLElBQTFCLEVBQWdDLFdBQWhDOzs7OztBQUtBLFlBQUksa0JBQWtCLEVBQXRCOztBQUVBLFlBQU0sdUJBQXVCLFNBQXZCLG9CQUF1QixDQUFDLElBQUQsRUFBVTtBQUNyQyxjQUFJLFlBQVksb0NBQVosQ0FBaUQsSUFBakQsQ0FBSixFQUE0RDtBQUMxRCw0QkFBZ0IsSUFBaEIsQ0FDRSxZQUFZLGdDQUFaLENBQTZDLElBQTdDLEVBQW1ELEtBQUssT0FBeEQsRUFBaUUsWUFBWSxFQUE3RSxDQURGO0FBR0Q7QUFDRixTQU5EOztBQVFBLFlBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QixZQUFZLGtCQUFaLENBQStCLG9CQUEvQixDQUE3Qjs7QUFFQSxlQUNFLGdCQUFnQixNQUFoQixLQUEyQixDQUEzQixHQUNBLFFBQVEsT0FBUixFQURBLEdBRUEsUUFBUSxHQUFSLENBQVksZUFBWixDQUhGO0FBS0QsT0FwQ0Q7QUFxQ0Q7Ozs7OztBQXZQRyxXLENBSUcsVSxHQUFhLDBCO2tCQXNQUCxXIiwiZmlsZSI6ImZvbnQtZ3JhYmJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogXG4gKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IERvd25sb2FkZXIgZnJvbSAnLi9kb3dubG9hZGVyJztcbmltcG9ydCAqIGFzIHJlZ2V4ZXMgZnJvbSAnLi9yZWdleGVzJztcbmltcG9ydCBpbmNsdWRlcyBmcm9tICdsb2Rhc2gvZnAvaW5jbHVkZXMnO1xuXG5cbi8qKlxuICpcbiAqL1xuY2xhc3MgRm9udEdyYWJiZXIge1xuICAvKipcbiAgICpcbiAgICovXG4gIHN0YXRpYyBkb3dubG9hZGVyID0gbmV3IERvd25sb2FkZXIoKTtcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHBvc3Rjc3NPcHRzXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVQb3N0Y3NzT3B0aW9ucyAocG9zdGNzc09wdHMpIHtcbiAgICBpZiAoISBwb3N0Y3NzT3B0cy5mcm9tKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc3Rjc3MtZm9udC1ncmFiYmVyIHJlcXVpcmVzIHBvc3Rjc3MgXCJmcm9tXCIgb3B0aW9uLicpO1xuICAgIH1cbiAgICBpZiAoISBwb3N0Y3NzT3B0cy50bykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb3N0Y3NzLWZvbnQtZ3JhYmJlciByZXF1aXJlcyBwb3N0Y3NzIFwidG9cIiBvcHRpb24uJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBpdGVyYXRvclxuICAgKiBAcmV0dXJucyB7ZnVuY3Rpb24oKX1cbiAgICovXG4gIHN0YXRpYyBpdGVyYXRlQ1NTUnVsZVdpdGggKGl0ZXJhdG9yKSB7XG4gICAgcmV0dXJuIChydWxlKSA9PiB7XG4gICAgICBydWxlLmVhY2goaXRlcmF0b3IpO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHNyY1xuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIHN0YXRpYyBnZW5lcmF0ZVVybE9iamVjdEZyb21TcmMgKHNyYykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHJlZ2V4ZXMuZXh0cmFjdFVybEZyb21Gb250RmFjZVNyY1JlZ2V4LmV4ZWMoc3JjKTtcblxuICAgIHJldHVybiAoXG4gICAgICByZXN1bHQgPT09IG51bGwgP1xuICAgICAgbnVsbCA6XG4gICAgICB1cmwucGFyc2UocmVzdWx0WzJdKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGtlcHRcbiAgICogQHBhcmFtIHZhbHVlXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgc3RhdGljIGtlZXBVbmlxdWVBbmRWYWxpZEZvbnRGaWxlVXJsT2JqZWN0IChrZXB0LCB2YWx1ZSkge1xuICAgIGlmIChcbiAgICAgIHZhbHVlICYmXG4gICAgICByZWdleGVzLnZhbGlkRm9udEV4dGVuc2lvblJlZ2V4LnRlc3QodmFsdWUucGF0aG5hbWUpICYmXG4gICAgICAoISBpbmNsdWRlcyhrZXB0LCB2YWx1ZSkpXG4gICAgKSB7XG4gICAgICBrZXB0LnB1c2godmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBrZXB0O1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBkb3dubG9hZERpclxuICAgKiBAcmV0dXJucyB7ZnVuY3Rpb24oKX1cbiAgICovXG4gIHN0YXRpYyBtYWtlRm9udERvd25sb2FkSm9iRGlzcGF0Y2hlciAoZG93bmxvYWREaXIpIHtcbiAgICByZXR1cm4gKGZvbnRVcmxPYmopID0+IHtcbiAgICAgIGNvbnN0IGZpbGVuYW1lID0gZm9udFVybE9iai5wYXRobmFtZS5zcGxpdCgnLycpLnBvcCgpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmwgICAgIDogZm9udFVybE9iai5ocmVmLFxuICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXG4gICAgICAgIHByb21pc2UgOiBGb250R3JhYmJlci5kb3dubG9hZGVyLmRvd25sb2FkKFxuICAgICAgICAgIGZvbnRVcmxPYmosXG4gICAgICAgICAgcGF0aC5qb2luKGRvd25sb2FkRGlyLCBmaWxlbmFtZSlcbiAgICAgICAgKSxcbiAgICAgIH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gb3B0c1xuICAgKiBAcGFyYW0gcG9zdGNzc09wdHNcbiAgICovXG4gIHN0YXRpYyByZXZpZXdPcHRpb25zIChvcHRzLCBwb3N0Y3NzT3B0cykge1xuICAgIGlmICghIG9wdHMuZGlyUGF0aCkge1xuICAgICAgb3B0cy5kaXJQYXRoID0gcGF0aC5kaXJuYW1lKHBvc3Rjc3NPcHRzLnRvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2tpcCBGb250LUZhY2UgUG9zdGNzcyBvYmplY3QgdGhhdCBpczpcbiAgICogICBub3QgYSBEZWNsYXJhdGlvblxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiBgc3JjYCBwcm9wZXJ0eVxuICAgKiAgIG9yIGRvZXNuJ3QgY29udGFpbiByZW1vdGUgZm9udCBmaWxlXG4gICAqXG4gICAqIEBwYXJhbSBkZWNsXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgc3RhdGljIHNob3VsZFByb2Nlc3NUaGlzRm9udEZhY2VEZWNsYXJhdGlvbiAoZGVjbCkge1xuICAgIGlmIChkZWNsLnR5cGUgIT09ICdkZWNsJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZGVjbC5wcm9wICE9PSAnc3JjJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocmVnZXhlcy5pc0ZvbnRGYWNlU3JjQ29udGFpbnNSZW1vdGVVcmxSZWdleC50ZXN0KGRlY2wudmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERvd25sb2FkIGZvbnQgZmlsZSBhbmQgdXBkYXRlIG91dHB1dCBDU1MgcnVsZSBjb3JyZXNwb25kaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBkZWNsIFBvc3Rjc3MgRGVjbGFyYXRpb24gb2JqZWN0LlxuICAgKiBAcGFyYW0gc2F2ZURpclBhdGhcbiAgICogQHBhcmFtIGNzc0ZpbGVQYXRoXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgc3RhdGljIGRvd25sb2FkRm9udEFuZFVwZGF0ZURlY2xhcmF0aW9uIChkZWNsLCBzYXZlRGlyUGF0aCwgY3NzRmlsZVBhdGgpIHtcbiAgICAvL1xuICAgIC8vIE9uZSBzcmMgY291bGQgaGF2ZSBtdWx0aXBsZSBgdXJsKClgLCB0aGV5IGFyZSBzZXBhcmF0ZWQgd2l0aCBgLGAuXG4gICAgLy9cbiAgICBjb25zdCBzcmNVcmxzID0gZGVjbC52YWx1ZVxuICAgICAgLnNwbGl0KCcsJylcbiAgICAgIC5tYXAodmFsdWUgPT4gdmFsdWUucmVwbGFjZShyZWdleGVzLnRyaW1SZWdleCwgJycpKTtcblxuICAgIC8vXG4gICAgLy8gVXNlIGBzcmNVcmxzYCB0byBnZW5lcmF0ZSBVcmwgb2JqZWN0cyBmb3IgZG93bmxvYWQuXG4gICAgLy8gVGhpcyB3aWxsIGNoZWNrIHRoZSB2YWxpZGF0aW9uIG9mIGZvbnQgdXJsLCBhbmQgb25seSBrZWVwIHdoaWNoIGlzXG4gICAgLy8gdW5pcXVlLlxuICAgIGNvbnN0IGZvbnRGaWxlVXJsT2JqZWN0cyA9IHNyY1VybHNcbiAgICAgIC5tYXAoRm9udEdyYWJiZXIuZ2VuZXJhdGVVcmxPYmplY3RGcm9tU3JjKVxuICAgICAgLnJlZHVjZShGb250R3JhYmJlci5rZWVwVW5pcXVlQW5kVmFsaWRGb250RmlsZVVybE9iamVjdCwgW10pO1xuXG4gICAgLy9cbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb250IGZpbGUgbmVlZHMgdG8gYmUgZG93bmxvYWQsIGVuZCB0aGlzIGZ1bmN0aW9uXG4gICAgLy8gTXVzdCByZXR1cm4gYSBwcm9taXNlLlxuICAgIC8vXG4gICAgaWYgKGZvbnRGaWxlVXJsT2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIERvd25sb2FkIGZvbnQgdG8gYHNhdmVEaXJQYXRoYCB1c2luZyBVcmwgb2JqZWN0cyAqKmNvbmN1cnJlbnRseSoqXG4gICAgLy8gYW5kIHJldHVybiBgam9iYCBvYmplY3RzIHRoYXQgY29udGFpbjpcbiAgICAvL1xuICAgIC8vICAgdXJsOiB0aGUgZnVsbCB1cmwgbmVlZHMgdG8gYmUgcmVwbGFjZWRcbiAgICAvLyAgIGZpbGVuYW1lOiB0aGUgbmFtZSBvZiB0aGUgc2F2ZWQgZmlsZVxuICAgIC8vICAgcHJvbWlzZTogYSBwcm9taXNlIHdpbGwgYmUgZnVsZmlsbGVkIHdoZW4gZG93bmxvYWQgY29tcGxldGVkXG4gICAgLy9cbiAgICBjb25zdCBqb2JzID0gZm9udEZpbGVVcmxPYmplY3RzLm1hcChcbiAgICAgIEZvbnRHcmFiYmVyLm1ha2VGb250RG93bmxvYWRKb2JEaXNwYXRjaGVyKHNhdmVEaXJQYXRoKVxuICAgICk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9icy5tYXAoam9iID0+IGpvYi5wcm9taXNlKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGZvbnQgZmlsZSBtaWdodCBiZSBzYXZlZCBpbiBhIGRpZmZlcmVudCBkaXJlY3RvcnkgdG8gdGhlIENTU1xuICAgICAgICAvLyBmaWxlLCAgYmVmb3JlIHJlcGxhY2UgdGhlIENTUyBydWxlLCB3ZSBoYXZlIHRvIGRlcml2ZSB0aGUgcmVsYXRpdmVcbiAgICAgICAgLy8gcGF0aCBiZXR3ZWVuIHRoZW0uXG4gICAgICAgIC8vXG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgcGF0aC5kaXJuYW1lKGNzc0ZpbGVQYXRoKSxcbiAgICAgICAgICBzYXZlRGlyUGF0aFxuICAgICAgICApO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFJlcGxhY2UgQ1NTIHJ1bGUgd2l0aCBldmVyeSBmb250IHRoYXQgZG93bmxvYWRlZC5cbiAgICAgICAgLy9cbiAgICAgICAgam9icy5tYXAoam9iID0+IHtcbiAgICAgICAgICBkZWNsLnZhbHVlID0gZGVjbC52YWx1ZS5yZXBsYWNlKFxuICAgICAgICAgICAgam9iLnVybCxcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFJlcGxhY2UgYFxcXFxgIHRvIGAvYCBmb3IgV2luZG93cyBjb21wYXRpYmlsaXR5LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIHBhdGguam9pbihyZWxhdGl2ZVBhdGgsIGpvYi5maWxlbmFtZSkucmVwbGFjZSgnXFxcXCcsICcvJylcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBkb3dubG9hZGVyXG4gICAqL1xuICBzdGF0aWMgc2V0RG93bmxvYWRlciAoZG93bmxvYWRlcikge1xuICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkZXIgPSBkb3dubG9hZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEByZXR1cm5zIHtEb3dubG9hZGVyfVxuICAgKi9cbiAgc3RhdGljIGdldERvd25sb2FkZXIgKCkge1xuICAgIHJldHVybiBGb250R3JhYmJlci5kb3dubG9hZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIE1ha2UgaGFuZGxlIGZ1bmN0aW9uIGZvciBwbHVnaW4gdG8gY2FsbCB3aXRoLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0c1xuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICBzdGF0aWMgbWFrZVBsdWdpbkhhbmRsZXIgKG9wdHMgPSB7fSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoY3NzLCByZXN1bHQpIHtcbiAgICAgIC8vXG4gICAgICAvLyBHZXQgdGhlIG9wdGlvbnMgZnJvbSBQb3N0Y3NzIGZvciBsYXRlciB1c2UuXG4gICAgICAvL1xuICAgICAgbGV0IHBvc3Rjc3NPcHRzID0gcmVzdWx0Lm9wdHM7XG5cbiAgICAgIC8vXG4gICAgICAvLyBJZiBzb21ldGhpbmcgaXMgbWlzc2luZyBpbiB0aGUgUG9zdGNzcyBvcHRpb25zLCB0aHJvdyBhbiBFcnJvci5cbiAgICAgIC8vXG4gICAgICBGb250R3JhYmJlci52YWxpZGF0ZVBvc3Rjc3NPcHRpb25zKHBvc3Rjc3NPcHRzKTtcblxuICAgICAgLy9cbiAgICAgIC8vIFJldmlldyBvcHRpb25zIGZvciBGb250IEdyYWJiZXIgKFRoaXMgbWF5IG1vZGlmeSB0aGVtKS5cbiAgICAgIC8vXG4gICAgICBGb250R3JhYmJlci5yZXZpZXdPcHRpb25zKG9wdHMsIHBvc3Rjc3NPcHRzKTtcblxuICAgICAgLy9cbiAgICAgIC8vIFByb2Nlc3MgZXZlcnkgRGVjbGFyYXRpb24gdGhhdCBtYXRjaHMgcnVsZSBgZm9udC1mYWNlYCBjb25jdXJyZW50bHkuXG4gICAgICAvL1xuICAgICAgbGV0IHByb2Nlc3NQcm9taXNlcyA9IFtdO1xuXG4gICAgICBjb25zdCBkZWNsYXJhdGlvblByb2Nlc3NvciA9IChkZWNsKSA9PiB7XG4gICAgICAgIGlmIChGb250R3JhYmJlci5zaG91bGRQcm9jZXNzVGhpc0ZvbnRGYWNlRGVjbGFyYXRpb24oZGVjbCkpIHtcbiAgICAgICAgICBwcm9jZXNzUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgIEZvbnRHcmFiYmVyLmRvd25sb2FkRm9udEFuZFVwZGF0ZURlY2xhcmF0aW9uKGRlY2wsIG9wdHMuZGlyUGF0aCwgcG9zdGNzc09wdHMudG8pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY3NzLndhbGtBdFJ1bGVzKC9mb250LWZhY2UvLCBGb250R3JhYmJlci5pdGVyYXRlQ1NTUnVsZVdpdGgoZGVjbGFyYXRpb25Qcm9jZXNzb3IpKTtcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgcHJvY2Vzc1Byb21pc2VzLmxlbmd0aCA9PT0gMCA/XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpIDpcbiAgICAgICAgUHJvbWlzZS5hbGwocHJvY2Vzc1Byb21pc2VzKVxuICAgICAgKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEZvbnRHcmFiYmVyOyJdfQ==