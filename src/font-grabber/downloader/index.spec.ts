import stream from 'stream';
import url from 'url';

import { Downloader } from './index';

namespace Helper {
    export function makeGet(response: stream.Stream): any {
        return jest.fn().mockImplementation((options, callback) => {
            callback(response);
        });
    }
}

describe('Downloader shloud download fonts correctly', () => {

    test('should download remote font files to specified directory from a HTTP URL', async () => {
        const responseSize = 1024;
        const fakeWritableStream = new stream.Writable();
        const createWriteStream = jest.fn().mockReturnValue(fakeWritableStream);
        const fakeFs = {
            createWriteStream,
        };
        const fakeResponse: any = {
            statusCode: 200,
            pipe: jest.fn().mockImplementation((writable, options) => {
                //
            }),
            on: jest.fn().mockImplementation((event, callback) => {
                callback(Buffer.alloc(responseSize));
            }),
        };

        const fakeHttpGet = Helper.makeGet(fakeResponse);
        const fakeHttpsGet = Helper.makeGet(fakeResponse);

        const fileName = 'font1.woff';
        const urlObject = url.parse('http://example.com/' + fileName);
        const downloadDir = '/var/project/public/fonts/';

        const downloader = new Downloader(fakeFs, fakeHttpGet, fakeHttpsGet);
        const fileInfo = downloader.download(urlObject, downloadDir);

        expect(await fileInfo).toEqual({
            fileName,
            filePath: downloadDir + fileName,
            size: responseSize,
        });

        expect(createWriteStream).toBeCalledWith(downloadDir + fileName);
        expect(fakeResponse.pipe.mock.calls[0][0]).toBe(fakeWritableStream);
        expect(fakeResponse.pipe.mock.calls[0][1]).toEqual({ end: true });
        expect(fakeResponse.on.mock.calls[0][0]).toBe('data');
        expect(fakeResponse.on.mock.calls[1][0]).toBe('end');
        expect(typeof fakeResponse.on.mock.calls[0][1]).toBe('function');
    });

});


