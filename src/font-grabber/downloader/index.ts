import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import url from 'url';

import { FileSystem, HttpGet, FileInfo, Downloader as DownloaderContract } from './contract';
import { pick } from '../../helpers';
import { getFontFilename } from '../functions';

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
     * @param timeout 
     */
    async download(
        urlObject: url.UrlWithStringQuery,
        downloadDirectory: string,
        timeout: number = 10000
    ): Promise<FileInfo> {
        const get = urlObject.protocol === 'http:' ? this.httpGet : this.httpsGet;
        const requestOptions = Object.assign(
            pick(urlObject, [
                'protocol',
                'host',
                'port',
                'path',
            ]),
            {
                timeout,
            }
        );

        return new Promise<FileInfo>((resolve, reject) => {
            get(requestOptions, response => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Remote server respond HTTP status: ${response.statusCode} instead of 200.`));
                }

                const contentType = response.headers ? response.headers['content-type'] : undefined;

                const fileName = getFontFilename(urlObject, contentType);
                const filePath = path.resolve(downloadDirectory, fileName);

                const downloadedFile = this.fsLibrary.createWriteStream(filePath);
                let fileSize = 0;

                response.on('data', (chunk: Buffer) => {
                    fileSize += chunk.length;
                });
                response.pipe(downloadedFile, { end: true });
                response.on('end', () => resolve({
                    size: fileSize,
                    fileName,
                    filePath,
                }));
            });
        });
    }
}