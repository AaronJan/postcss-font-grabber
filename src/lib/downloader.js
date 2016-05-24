/**
 * A class for downloading stuff.
 */

import fs from 'fs';
import http from 'http';


class Downloader {
  /**
   *
   */
  http;

  /**
   *
   */
  fs;

  /**
   *
   */
  constructor () {
    this.setHttpLib(http);
    this.setFsLib(fs);
  }

  /**
   *
   * @param httpLib
   */
  setHttpLib (httpLib) {
    this.http = httpLib;
  }

  /**
   *
   * @param fsLib
   */
  setFsLib (fsLib) {
    this.fs = fsLib;
  }

  /**
   * Download file to `distPath` and returns a promise.
   *
   * @param urlObj
   * @param filePath
   * @returns {Promise}
   */
  download (urlObj, filePath) {
    return new Promise((resolve, reject) => {
      const downloadedFile = this.fs.createWriteStream(filePath);

      //
      // Use build in `Http` module to download font file
      // but it **doesn't support HTTPS**.
      //

      this.http.get({
        ...urlObj,
        protocol: 'http:',
      }, function getFileFromServer (res) {
        //
        // Check remote response, thorw an Error if HTTP status code isn't
        // `200`.
        //

        if (res.statusCode !== 200) {
          reject(`Remote server respond HTTP status: ${res.statusCode} instead of 200.`);
          return;
        }

        res.pipe(downloadedFile, { end: false });

        res.on('end', () => {
          downloadedFile.end('');

          resolve();
        });
      });
    });
  }
}

//
// Expose default.
//
export default Downloader;
