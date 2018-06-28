import url from 'url';

jest.mock('./functions');

import { PluginSettings, Job, JobResult } from '../contracts';
import { FontGrabber } from './index';

describe('makeTransformer', () => {

    test('works as expected', async () => {
        const values = {
            directoryPath: '/var/project/public/fonts',
            remoteFontHost: 'https://example.com/',
            remoteFontUrl: 'https://example.com/folder/font1.woff2',
            fontFormat: 'woff2',
            cssSourceFilePath: '/var/project/public/dist/style.css',
            cssTargetFilePath: '/var/project/public/dist/style.css',
            localFontPath: '/var/project/public/dist/font1.woff2',
            fontFilename: 'font1.woff2',
        };

        const job: Job = {
            remoteFont: {
                urlObject: url.parse(values.remoteFontHost),
                format: values.fontFormat,
            },
            css: {
                sourcePath: values.cssSourceFilePath,
                targetDirectoryPath: values.cssTargetFilePath,
            },
            font: {
                path: values.localFontPath,
                filename: values.fontFilename,
            },
        };
        const postcssNode: any = {
            value: ` url(${values.remoteFontUrl}) format(${values.fontFormat}) `,
        };
        const postcssRoot: any = {
            source: {
                input: {
                    file: '/var/project/public/style.css',
                },
            },
            walkAtRules: (regex, callback) => {
                const rule = {
                    each: declarationProcessor => {
                        declarationProcessor(postcssNode);
                    },
                };

                callback(rule);
            },
        };
        const postcssResult: any = {
            opts: {
                to: '/var/project/public/dist/style.css',
            },
        };

        /**
         * Mock dependency functions
         */
        const {
            parseOptions,
            isRemoteFontFaceDeclaration,
            processDeclaration,
            downloadFont,
        } = require('./functions');

        isRemoteFontFaceDeclaration.mockReturnValue(true);
        parseOptions.mockImplementation(options => {
            return options;
        });
        processDeclaration.mockImplementation((declaration, cssFilePath, downloadDirectoryPath): Job[] => {
            return [job];
        });
        downloadFont.mockImplementation((job, autoCreateDirectory, downloader): Promise<JobResult> => {
            return Promise.resolve({
                job,
                download: {
                    size: 123,
                },
            });
        });

        /**
         * 
         */

        const settings: PluginSettings = {
            cssDestinationDirectoryPath: values.directoryPath,
            directoryPath: values.directoryPath,
            autoCreateDirectory: false,
        };

        const fontGrabber = new FontGrabber(settings);
        const transformer = fontGrabber.makeTransformer();

        await transformer(postcssRoot, postcssResult);

        /**
         * assertions
         */

        expect(isRemoteFontFaceDeclaration).toBeCalledWith(postcssNode);

    });


});