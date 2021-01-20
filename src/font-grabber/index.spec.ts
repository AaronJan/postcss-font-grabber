import postcss from 'postcss';
import url from 'url';

jest.mock('./functions');

import { PluginSettings, Job, JobResult, Meta } from '../contracts';
import { FontGrabber } from './index';

describe('makeTransformer', () => {

    test('works as expected', async () => {
        const values = {
            directoryPath: '/var/project/public/fonts',
            remoteFontUrl: 'https://example.com/folder/font1.woff2',
            fontFormat: 'woff2',
            cssSourceFilePath: '/var/project/public/style.css',
            cssSourceDirectoryPath: '/var/project/public/dist',
            cssDestinationFilePath: '/var/project/public/dist/style.css',
            cssDestinationDirectoryPath: '/var/project/public/dist',
            localFontPath: '/var/project/public/dist/font1.woff2',
            fontFilename: 'font1.woff2',
            postcssOptsTo: '/var/project/public/dist/style.css',
            fontFileSize: 123321,
        };

        const job: Job = {
            remoteFont: {
                urlObject: url.parse(values.remoteFontUrl),
                format: values.fontFormat,
            },
            css: {
                sourcePath: values.cssSourceFilePath,
                destinationDirectoryPath: values.cssDestinationDirectoryPath,
            },
            font: {
                destinationDirectoryPath: values.cssSourceDirectoryPath,
                destinationRelativePath: '.',
            },
            declaration: {} as any as postcss.Declaration,
        };
        const postcssNode: any = {
            value: ` url(${values.remoteFontUrl}) format(${values.fontFormat}) `,
        };
        const postcssRoot: any = {
            source: {
                input: {
                    file: values.cssSourceFilePath,
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
                to: values.postcssOptsTo,
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
            calculateCssOutputDirectoryPath,
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
                    size: values.fontFileSize,
                    fileName: values.fontFilename,
                    path: values.localFontPath,
                },
            });
        });
        calculateCssOutputDirectoryPath.mockReturnValueOnce(values.cssDestinationDirectoryPath);

        /**
         * 
         */

        const settings: PluginSettings = {
            cssSourceDirectoryPath: values.cssSourceDirectoryPath,
            cssDestinationDirectoryPath: values.cssDestinationDirectoryPath,
            fontDirectoryPath: values.directoryPath,
            autoCreateDirectory: false,
        };

        const fontGrabber = new FontGrabber(settings);
        const transformer = fontGrabber.makeTransformer();

        const onDone = new Promise((resolve, reject) => {
            fontGrabber.onDone(meta => {
                resolve(meta);
            });
        });

        await transformer(postcssRoot, postcssResult);

        /**
         * assertions
         */

        expect(isRemoteFontFaceDeclaration).toBeCalledWith(postcssNode);
        expect(calculateCssOutputDirectoryPath).toBeCalledWith(
            values.cssSourceFilePath,
            values.cssSourceDirectoryPath,
            values.cssDestinationDirectoryPath,
            values.postcssOptsTo
        );
        expect(onDone).resolves.toEqual(<Meta>{
            jobResults: [
                {
                    download: {
                        size: values.fontFileSize,
                        fileName: values.fontFilename,
                        path: values.localFontPath,
                    },
                    job: {
                        remoteFont: {
                            urlObject: url.parse(values.remoteFontUrl),
                            format: values.fontFormat,
                        },
                        css: {
                            sourcePath: values.cssSourceFilePath,
                            destinationDirectoryPath: values.cssDestinationDirectoryPath,
                        },
                        font: {
                            destinationDirectoryPath: values.cssSourceDirectoryPath,
                            destinationRelativePath: '.',
                        },
                    },
                },
            ],
        });
    });


});