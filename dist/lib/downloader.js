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

//
// Expose default.
//


exports.default = Downloader;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZG93bmxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFJQTs7OztBQUNBOzs7Ozs7OztJQUdNLFU7Ozs7Ozs7Ozs7QUFjSix3QkFBZTtBQUFBOztBQUNiLFNBQUssVUFBTDtBQUNBLFNBQUssUUFBTDtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7K0JBTVcsTyxFQUFTO0FBQ25CLFdBQUssSUFBTCxHQUFZLE9BQVo7QUFDRDs7Ozs7Ozs7OzZCQU1TLEssRUFBTztBQUNmLFdBQUssRUFBTCxHQUFVLEtBQVY7QUFDRDs7Ozs7Ozs7Ozs7OzZCQVNTLE0sRUFBUSxRLEVBQVU7QUFBQTs7QUFDMUIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFlBQU0saUJBQWlCLE1BQUssRUFBTCxDQUFRLGlCQUFSLENBQTBCLFFBQTFCLENBQXZCOzs7Ozs7O0FBT0EsY0FBSyxJQUFMLENBQVUsR0FBVixjQUNLLE1BREw7QUFFRSxvQkFBVTtBQUZaLFlBR0csU0FBUyxpQkFBVCxDQUE0QixHQUE1QixFQUFpQzs7Ozs7O0FBTWxDLGNBQUksSUFBSSxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCLDJEQUE2QyxJQUFJLFVBQWpEO0FBQ0E7QUFDRDs7QUFFRCxjQUFJLElBQUosQ0FBUyxjQUFULEVBQXlCLEVBQUUsS0FBSyxLQUFQLEVBQXpCOztBQUVBLGNBQUksRUFBSixDQUFPLEtBQVAsRUFBYyxZQUFNO0FBQ2xCLDJCQUFlLEdBQWYsQ0FBbUIsRUFBbkI7O0FBRUE7QUFDRCxXQUpEO0FBS0QsU0FyQkQ7QUFzQkQsT0E5Qk0sQ0FBUDtBQStCRDs7Ozs7Ozs7Ozs7a0JBTVksVSIsImZpbGUiOiJkb3dubG9hZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBIGNsYXNzIGZvciBkb3dubG9hZGluZyBzdHVmZi5cbiAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5cblxuY2xhc3MgRG93bmxvYWRlciB7XG4gIC8qKlxuICAgKlxuICAgKi9cbiAgaHR0cDtcblxuICAvKipcbiAgICpcbiAgICovXG4gIGZzO1xuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuc2V0SHR0cExpYihodHRwKTtcbiAgICB0aGlzLnNldEZzTGliKGZzKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gaHR0cExpYlxuICAgKi9cbiAgc2V0SHR0cExpYiAoaHR0cExpYikge1xuICAgIHRoaXMuaHR0cCA9IGh0dHBMaWI7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGZzTGliXG4gICAqL1xuICBzZXRGc0xpYiAoZnNMaWIpIHtcbiAgICB0aGlzLmZzID0gZnNMaWI7XG4gIH1cblxuICAvKipcbiAgICogRG93bmxvYWQgZmlsZSB0byBgZGlzdFBhdGhgIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAgICpcbiAgICogQHBhcmFtIHVybE9ialxuICAgKiBAcGFyYW0gZmlsZVBhdGhcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBkb3dubG9hZCAodXJsT2JqLCBmaWxlUGF0aCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBkb3dubG9hZGVkRmlsZSA9IHRoaXMuZnMuY3JlYXRlV3JpdGVTdHJlYW0oZmlsZVBhdGgpO1xuXG4gICAgICAvL1xuICAgICAgLy8gVXNlIGJ1aWxkIGluIGBIdHRwYCBtb2R1bGUgdG8gZG93bmxvYWQgZm9udCBmaWxlXG4gICAgICAvLyBidXQgaXQgKipkb2Vzbid0IHN1cHBvcnQgSFRUUFMqKi5cbiAgICAgIC8vXG5cbiAgICAgIHRoaXMuaHR0cC5nZXQoe1xuICAgICAgICAuLi51cmxPYmosXG4gICAgICAgIHByb3RvY29sOiAnaHR0cDonLFxuICAgICAgfSwgZnVuY3Rpb24gZ2V0RmlsZUZyb21TZXJ2ZXIgKHJlcykge1xuICAgICAgICAvL1xuICAgICAgICAvLyBDaGVjayByZW1vdGUgcmVzcG9uc2UsIHRob3J3IGFuIEVycm9yIGlmIEhUVFAgc3RhdHVzIGNvZGUgaXNuJ3RcbiAgICAgICAgLy8gYDIwMGAuXG4gICAgICAgIC8vXG5cbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICByZWplY3QoYFJlbW90ZSBzZXJ2ZXIgcmVzcG9uZCBIVFRQIHN0YXR1czogJHtyZXMuc3RhdHVzQ29kZX0gaW5zdGVhZCBvZiAyMDAuYCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLnBpcGUoZG93bmxvYWRlZEZpbGUsIHsgZW5kOiBmYWxzZSB9KTtcblxuICAgICAgICByZXMub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICBkb3dubG9hZGVkRmlsZS5lbmQoJycpO1xuXG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbi8vXG4vLyBFeHBvc2UgZGVmYXVsdC5cbi8vXG5leHBvcnQgZGVmYXVsdCBEb3dubG9hZGVyO1xuIl19