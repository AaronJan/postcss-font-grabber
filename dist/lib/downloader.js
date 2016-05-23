'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * A class for downloading stuff.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Downloader = function () {

  /**
   *
   */

  /**
   *
   */

  function Downloader() {
    _classCallCheck(this, Downloader);

    this.setHttpLib(_http2.default);
    this.setFsLib(_fs2.default);
  }

  /**
   *
   * @param httpLib
   */


  /**
   *
   */


  _createClass(Downloader, [{
    key: 'setHttpLib',
    value: function setHttpLib(httpLib) {
      this.http = httpLib;
    }

    /**
     *
     * @param fsLib
     */

  }, {
    key: 'setFsLib',
    value: function setFsLib(fsLib) {
      this.fs = fsLib;
    }

    /**
     * Download file to `distPath` and returns a promise.
     *
     * @param urlObj
     * @param filePath
     * @returns {Promise}
     */

  }, {
    key: 'download',
    value: function download(urlObj, filePath) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var downloadedFile = _this.fs.createWriteStream(filePath);

        //
        // Use build in `Http` module to download font file
        // but it **doesn't support HTTPS**.
        //

        _this.http.get(_extends({}, urlObj, {
          protocol: 'http:'
        }), function getFileFromServer(res) {
          //
          // Check remote response, thorw an Error if HTTP status code isn't
          // `200`.
          //

          if (res.statusCode !== 200) {
            reject('Remote server respond HTTP status: ' + res.statusCode + ' instead of 200.');
            return;
          }

          res.pipe(downloadedFile, { end: false });

          res.on('end', function () {
            downloadedFile.end('');

            resolve();
          });
        });
      });
    }
  }]);

  return Downloader;
}();

exports.default = Downloader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZG93bmxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFJQTs7OztBQUNBOzs7Ozs7OztJQUdNLFU7Ozs7Ozs7Ozs7QUFjSix3QkFBZTtBQUFBOztBQUNiLFNBQUssVUFBTDtBQUNBLFNBQUssUUFBTDtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7K0JBTVcsTyxFQUFTO0FBQ25CLFdBQUssSUFBTCxHQUFZLE9BQVo7QUFDRDs7Ozs7Ozs7OzZCQU1TLEssRUFBTztBQUNmLFdBQUssRUFBTCxHQUFVLEtBQVY7QUFDRDs7Ozs7Ozs7Ozs7OzZCQVNTLE0sRUFBUSxRLEVBQVU7QUFBQTs7QUFDMUIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0saUJBQWlCLE1BQUssRUFBTCxDQUFRLGlCQUFSLENBQTBCLFFBQTFCLENBQXZCOzs7Ozs7O0FBT0EsY0FBSyxJQUFMLENBQVUsR0FBVixjQUNLLE1BREw7QUFFRSxvQkFBVTtBQUZaLFlBR0csU0FBUyxpQkFBVCxDQUE0QixHQUE1QixFQUFpQzs7Ozs7O0FBTWxDLGNBQUksSUFBSSxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCLDJEQUE2QyxJQUFJLFVBQWpEO0FBQ0E7QUFDRDs7QUFFRCxjQUFJLElBQUosQ0FBUyxjQUFULEVBQXlCLEVBQUUsS0FBSyxLQUFQLEVBQXpCOztBQUVBLGNBQUksRUFBSixDQUFPLEtBQVAsRUFBYyxZQUFNO0FBQ2xCLDJCQUFlLEdBQWYsQ0FBbUIsRUFBbkI7O0FBRUE7QUFDRCxXQUpEO0FBS0QsU0FyQkQ7QUFzQkQsT0E5Qk0sQ0FBUDtBQStCRDs7Ozs7O2tCQUlZLFUiLCJmaWxlIjoiZG93bmxvYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQSBjbGFzcyBmb3IgZG93bmxvYWRpbmcgc3R1ZmYuXG4gKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuXG5cbmNsYXNzIERvd25sb2FkZXIge1xuICAvKipcbiAgICpcbiAgICovXG4gIGh0dHA7XG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICBmcztcblxuICAvKipcbiAgICpcbiAgICovXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLnNldEh0dHBMaWIoaHR0cCk7XG4gICAgdGhpcy5zZXRGc0xpYihmcyk7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGh0dHBMaWJcbiAgICovXG4gIHNldEh0dHBMaWIgKGh0dHBMaWIpIHtcbiAgICB0aGlzLmh0dHAgPSBodHRwTGliO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBmc0xpYlxuICAgKi9cbiAgc2V0RnNMaWIgKGZzTGliKSB7XG4gICAgdGhpcy5mcyA9IGZzTGliO1xuICB9XG5cbiAgLyoqXG4gICAqIERvd25sb2FkIGZpbGUgdG8gYGRpc3RQYXRoYCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSB1cmxPYmpcbiAgICogQHBhcmFtIGZpbGVQYXRoXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgZG93bmxvYWQgKHVybE9iaiwgZmlsZVBhdGgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgZG93bmxvYWRlZEZpbGUgPSB0aGlzLmZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVQYXRoKTtcblxuICAgICAgLy9cbiAgICAgIC8vIFVzZSBidWlsZCBpbiBgSHR0cGAgbW9kdWxlIHRvIGRvd25sb2FkIGZvbnQgZmlsZVxuICAgICAgLy8gYnV0IGl0ICoqZG9lc24ndCBzdXBwb3J0IEhUVFBTKiouXG4gICAgICAvL1xuXG4gICAgICB0aGlzLmh0dHAuZ2V0KHtcbiAgICAgICAgLi4udXJsT2JqLFxuICAgICAgICBwcm90b2NvbDogJ2h0dHA6JyxcbiAgICAgIH0sIGZ1bmN0aW9uIGdldEZpbGVGcm9tU2VydmVyIChyZXMpIHtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2hlY2sgcmVtb3RlIHJlc3BvbnNlLCB0aG9ydyBhbiBFcnJvciBpZiBIVFRQIHN0YXR1cyBjb2RlIGlzbid0XG4gICAgICAgIC8vIGAyMDBgLlxuICAgICAgICAvL1xuXG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG4gICAgICAgICAgcmVqZWN0KGBSZW1vdGUgc2VydmVyIHJlc3BvbmQgSFRUUCBzdGF0dXM6ICR7cmVzLnN0YXR1c0NvZGV9IGluc3RlYWQgb2YgMjAwLmApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy5waXBlKGRvd25sb2FkZWRGaWxlLCB7IGVuZDogZmFsc2UgfSk7XG5cbiAgICAgICAgcmVzLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgZG93bmxvYWRlZEZpbGUuZW5kKCcnKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IERvd25sb2FkZXI7XG4iXX0=