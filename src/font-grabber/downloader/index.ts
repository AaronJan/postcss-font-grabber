import fs from 'fs';
import http from 'http';
import https from 'https';
import url from 'url';

import { FileSystem, HttpGet, FileInfo, Downloader as DownloaderContract } from './contract';
import { pick } from '../../helpers';

export class Downloader implements DownloaderContract {
    constructor(
        protected fsLibrary: FileSystem = fs,
        protected httpGet: HttpGet = http.get,
        protected httpsGet: HttpGet = https.get
    ) {
        //
    }

    /**
     * 
     * @param urlObject 
     * @param filePath 
     */
    async download(
        urlObject: url.UrlWithStringQuery,
        filePath: string
    ): Promise<FileInfo> {
        const downloadedFile = this.fsLibrary.createWriteStream(filePath);
        const get = urlObject.protocol === 'http:' ? this.httpGet : this.httpsGet;
        const requestOptions = Object.assign(
            pick(urlObject, [
                'protocol',
                'host',
                'port',
                'path',
            ]),
            {
                timeout: 10000,
            }
        );

        return new Promise<FileInfo>((resolve, reject) => {
            get(requestOptions, response => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Remote server respond HTTP status: ${response.statusCode} instead of 200.`));
                }

                response.pipe(downloadedFile, { end: true });
                response.on('end', () => resolve({
                    size: response.readableLength,
                }));
            });
        });
    }
}