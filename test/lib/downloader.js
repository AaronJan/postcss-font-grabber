/**
 *
 */
import test from 'ava';
import url from 'url';
import Downloader from '../../dist/lib/downloader';

/**
 *
 */
test('download file', async t => {
  t.plan(2);

  const downloader = new Downloader();
  const fs         = makeMockFS();
  const http       = makeMockHttp();

  const remoteUrlObject = url.parse('http://dummy.com');
  const filePath        = '/var/dummy.file';

  downloader.setFsLib(fs);
  downloader.setHttpLib(http);

  await downloader.download(remoteUrlObject, filePath);

  t.is(fs.getFilePath(), filePath);
  t.deepEqual(remoteUrlObject, http.getOptions(), 'url must be received');
});

/**
 *
 */
test('download file but get an error', async t => {
  t.plan(3);

  const downloader = new Downloader();
  const fs         = makeMockFS();
  const http       = makeMockHttp(404);

  const remoteUrlObject = url.parse('http://dummy.com');
  const filePath        = '/var/dummy.file';

  downloader.setFsLib(fs);
  downloader.setHttpLib(http);

  await t.throws(downloader.download(remoteUrlObject, filePath), Error, 'get an Error when HTTP statue code isn\'t 200');

  t.is(fs.getFilePath(), filePath);
  t.deepEqual(remoteUrlObject, http.getOptions(), 'url must be received');
});

/**
 *
 * @returns {FileSystem}
 */
function makeMockFS () {
  class FileSystem {
    fileStream;
    filePath;

    constructor () {

    }

    makeMockWriteableStream (filePath) {
      return {
        filePath: filePath,
        end () {

        },
      };
    }

    createWriteStream (filePath) {
      this.filePath   = filePath;
      this.fileStream = this.makeMockWriteableStream(filePath);

      return this.fileStream;
    }

    getFileStream () {
      return this.fileStream;
    }

    getFilePath () {
      return this.filePath;
    }
  }

  return new FileSystem();
}

/**
 *
 * @param statusCode
 * @returns {Http}
 */
function makeMockHttp (statusCode = 200) {
  class Http {
    options;

    getOptions () {
      return this.options;
    }

    get (options, callback) {
      this.options = options;

      const mockRes = {
        statusCode: statusCode,

        pipe (dest, options) {

        },

        on (event, callback) {
          if (event === 'end') {
            callback();
          }
        },
      };

      callback(mockRes);
    }
  }

  return new Http();
}