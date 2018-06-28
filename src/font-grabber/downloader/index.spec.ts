import stream from 'stream';
import url from 'url';

jest.mock('../../helpers');
import { Downloader } from './index';

namespace Helper {
    export function makeFakeFs(): any {
        return {
            createWriteStream: (filePath): stream.Stream => {
                return new stream();
            },
        };
    }

    export function makeGet(response: stream.Stream): any {
        return (options, callback) => {
            callback(response);
        };
    }
}

describe('Downloader shloud download fonts correctly', () => {

    test('', () => {
        expect(true).toBeTruthy();
    });

    // test('should download remote font files to specified directory from a HTTP URL', () => {
    //     const { makeDirectoryRecursively } = require('../../helpers');

    //     makeDirectoryRecursively.mockImplementation(() => {
    //         return Promise.resolve();
    //     });

    //     const fakeResponse: any = new stream.Writable();
    //     fakeResponse.statusCode = 200;
    //     fakeResponse.readableLength = 1024;

    //     const fakeFs = Helper.makeFakeFs();
    //     const fakeHttpGet = Helper.makeGet(fakeResponse);
    //     const fakeHttpsGet = Helper.makeGet(fakeResponse);

    //     const urlObject = url.parse('http://example.com');
    //     const filePath = '/var/project/public/fonts/font1.woff';
    //     const autoCreateDirectory = true;

    //     const downloader = new Downloader(fakeFs, fakeHttpGet, fakeHttpsGet);
    //     const fileInfo = downloader.download(urlObject, filePath, autoCreateDirectory);

    //     expect(fileInfo).resolves.toEqual({
    //         size: 1024,
    //     });
    // });

});


