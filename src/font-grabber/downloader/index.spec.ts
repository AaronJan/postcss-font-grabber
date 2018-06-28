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
        const fakeWritableStream = new stream.Writable();
        const createWriteStream = jest.fn().mockReturnValue(fakeWritableStream);
        const fakeFs = {
            createWriteStream,
        };
        const fakeResponse: any = {
            statusCode: 200,
            readableLength: 1024,
            pipe: jest.fn().mockImplementation((writable, options) => {
                //
            }),
            on: jest.fn().mockImplementation((event, callback) => {
                callback();
            }),
        };

        const fakeHttpGet = Helper.makeGet(fakeResponse);
        const fakeHttpsGet = Helper.makeGet(fakeResponse);

        const urlObject = url.parse('http://example.com');
        const filePath = '/var/project/public/fonts/font1.woff';

        const downloader = new Downloader(fakeFs, fakeHttpGet, fakeHttpsGet);
        const fileInfo = downloader.download(urlObject, filePath);

        expect(await fileInfo).toEqual({
            size: 1024,
        });

        expect(createWriteStream).toBeCalledWith(filePath);
        expect(fakeResponse.pipe.mock.calls[0][0]).toBe(fakeWritableStream);
        expect(fakeResponse.pipe.mock.calls[0][1]).toEqual({ end: true });
        expect(fakeResponse.on.mock.calls[0][0]).toBe('end');
        expect(typeof fakeResponse.on.mock.calls[0][1]).toBe('function');
    });

});


