import sinon from 'sinon';
import url from 'url';
import crypto from 'crypto';

import { PluginOptions } from '../contracts';
import * as functions from './functions';

describe('parseOptions', () => {

    test('minimal options', () => {
        const options: PluginOptions = {
            cssDestinationDirectoryPath: '/var/project/public/dist/',
        };
        const settings = functions.parseOptions(options);

        expect(settings).toEqual({
            cssDestinationDirectoryPath: '/var/project/public/dist',
            directoryPath: undefined,
            autoCreateDirectory: true,
        });
    });

    test('`autoCreateDirectory` is false', () => {
        const options: PluginOptions = {
            cssDestinationDirectoryPath: '/var/project/public/dist/',
            autoCreateDirectory: false,
        };
        const settings = functions.parseOptions(options);

        expect(settings).toEqual({
            cssDestinationDirectoryPath: '/var/project/public/dist',
            directoryPath: undefined,
            autoCreateDirectory: false,
        });
    });

    test('`directoryPath`', () => {
        const directoryPath = 'my-project/dist';
        const options: PluginOptions = {
            cssDestinationDirectoryPath: '/var/project/public/dist/',
            directoryPath,
        };
        const settings = functions.parseOptions(options);

        if (process.platform.match(/^win/)) {
            expect(settings.directoryPath).toMatch(/[a-z]:\\.*?my\-project\\dist/i);
        } else {
            expect(settings.directoryPath).toMatch(/\/.*?my-project\/dist/i);
        }
    });

});

describe('isRemoteFontFaceDeclaration', () => {

    test('Node\'s type doesn\'t match', () => {
        const node: any = {
            type: 'node',
        };

        expect(functions.isRemoteFontFaceDeclaration(node)).toBeFalsy();
    });

    test('Declaration\'s `prop` isn\'t "src"', () => {
        const node: any = {
            type: 'decl',
            prop: 'value',
        };

        expect(functions.isRemoteFontFaceDeclaration(node)).toBeFalsy();
    });

    test('doesn\'t contain a remote font URI', () => {
        const node: any = {
            type: 'decl',
            prop: 'src',
            value: " local('Tangerine Regular'), local('Tangerine-Regular'), url(../font-file/font.woff2) format('woff2')",
        };

        expect(functions.isRemoteFontFaceDeclaration(node)).toBeFalsy();
    });

    test('works as expected', () => {
        const node: any = {
            type: 'decl',
            prop: 'src',
            value: " local('Tangerine Regular'), local('Tangerine-Regular'), url(https://fonts.gstatic.com/s/tangerine/v9/IurY6Y5j_oScZZow4VOxCZZMprNA4A.woff2) format('woff2')",
        };

        expect(functions.isRemoteFontFaceDeclaration(node)).toBeTruthy();
    });

});

describe('getFontFilename', () => {

    test('corrupt URL object', () => {
        const stubUrl = 'https://example.com';
        const stubUrlMd5 = crypto.createHash('md5')
            .update(stubUrl)
            .digest()
            .toString('hex');

        const urlObject: any = {
            protocol: 'https',
            hostname: 'example.com',
        };

        expect(functions.getFontFilename(urlObject)).toBe(stubUrlMd5);
    });

    test('URL object\'s `pathname` is an empty string', () => {
        const stubUrl = 'https://example.com';
        const stubUrlMd5 = crypto.createHash('md5')
            .update(stubUrl)
            .digest()
            .toString('hex');

        const urlObject: any = {
            protocol: 'https',
            hostname: 'example.com',
            pathname: '',
        };

        expect(functions.getFontFilename(urlObject)).toBe(stubUrlMd5);
    });

    test('works as expected', () => {
        const urlObject: any = {
            pathname: 'folder1/folder2/font.file.woff2',
        };

        expect(functions.getFontFilename(urlObject)).toBe('font.file.woff2');
    });

});

describe('getFontFormatFromUrlObject', () => {

    test('empty pathname', () => {
        const urlObject: any = {};

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBeUndefined();
    });

    test('various extensions - embedded-opentype', () => {
        const urlObject: any = {
            pathname: '/folder/font.eot',
        };

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBe('embedded-opentype');
    });

    test('various extensions - woff', () => {
        const urlObject: any = {
            pathname: '/folder/font.woff',
        };

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBe('woff');
    });

    test('various extensions - woff2', () => {
        const urlObject: any = {
            pathname: '/folder/font.woff2',
        };

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBe('woff2');
    });

    test('various extensions - truetype', () => {
        const urlObject: any = {
            pathname: '/folder/font.ttf',
        };

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBe('truetype');
    });

    test('various extensions - svg', () => {
        const urlObject: any = {
            pathname: '/folder/font.svg',
        };

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBe('svg');
    });

    test('unknow extension', () => {
        const urlObject: any = {
            pathname: '/folder/font.jpg',
        };

        expect(functions.getFontFormatFromUrlObject(urlObject)).toBeUndefined();
    });

});

describe('getFontInfoFromSrc', () => {

    test('quote compatibility', () => {
        const srcWithDoubleQuote = 'url("https://example.com/folder/font.woff") format("woff2")';
        expect(functions.getFontInfoFromSrc(srcWithDoubleQuote)).toEqual({
            urlObject: url.parse('https://example.com/folder/font.woff'),
            format: 'woff2',
        });

        const srcWithSingleQuote = "url('https://example.com/folder/font.woff') format('woff2')";
        expect(functions.getFontInfoFromSrc(srcWithSingleQuote)).toEqual({
            urlObject: url.parse('https://example.com/folder/font.woff'),
            format: 'woff2',
        });

        const srcWithoutQuote = 'url(https://example.com/folder/font.woff) format(woff2)';
        expect(functions.getFontInfoFromSrc(srcWithoutQuote)).toEqual({
            urlObject: url.parse('https://example.com/folder/font.woff'),
            format: 'woff2',
        });
    });

    test('no format', () => {
        const src = 'url(https://example.com/folder/font.woff) ';

        expect(functions.getFontInfoFromSrc(src)).toEqual({
            urlObject: url.parse('https://example.com/folder/font.woff'),
            format: 'woff',
        });
    });

    test('can\'t determine format', () => {
        const src = 'url(https://example.com/folder/font) ';

        expect(() => {
            functions.getFontInfoFromSrc(src);
        })
            .toThrow(`can't get the font format from @font-face src: [${src}]`);
    });

});

describe('reduceSrcsToFontInfos', () => {

    test('no valid FontInfo', () => {
        const srcs = [
            'url(../font.woff)',
        ];
        const reduced = srcs.reduce(functions.reduceSrcsToFontInfos, []);

        expect(reduced).not.toContain(expect.anything);
    });

    test('valid FontInfos', () => {
        const srcs = [
            'url(https://example.com/font1.woff)',
            'url(https://example.com/font2.eot)',
        ];
        const expected = [
            {
                urlObject: url.parse('https://example.com/font1.woff'),
                format: 'woff',
            },
            {
                urlObject: url.parse('https://example.com/font2.eot'),
                format: 'embedded-opentype',
            },
        ];
        const reduced = srcs.reduce(functions.reduceSrcsToFontInfos, []);

        expect(reduced).toEqual(expect.arrayContaining(expected));
    });

});

describe('processDeclaration', () => {

    test('works as expected', () => {
        const declaration: any = {
            value: ' url(https://example.com/folder/font1.woff2) format(woff2), url(https://example.com/folder/font2.woff)',
        };
        const cssSourceFilePath = '/var/project/public/style.css';
        const cssTargetDirectoryPath = '/var/project/public/dist';
        const downloadDirectoryPath = '/var/project/public/fonts/';

        const jobs = functions.processDeclaration(
            declaration,
            cssSourceFilePath,
            cssTargetDirectoryPath,
            downloadDirectoryPath
        );
        const expected = [
            {
                remoteFont: {
                    urlObject: url.parse('https://example.com/folder/font1.woff2'),
                    format: 'woff2',
                },
                css: {
                    sourcePath: cssSourceFilePath,
                    targetDirectoryPath: cssTargetDirectoryPath,
                },
                font: {
                    path: `${downloadDirectoryPath}font1.woff2`,
                    filename: 'font1.woff2',
                },
            },
            {
                remoteFont: {
                    urlObject: url.parse('https://example.com/folder/font2.woff'),
                    format: 'woff',
                },
                css: {
                    sourcePath: cssSourceFilePath,
                    targetDirectoryPath: cssTargetDirectoryPath,
                },
                font: {
                    path: `${downloadDirectoryPath}font2.woff`,
                    filename: 'font2.woff',
                },
            },
        ];

        expect(jobs).toEqual(expect.arrayContaining(expected));
        expect(declaration.value).toEqual(' url(../fonts/font1.woff2) format(woff2), url(../fonts/font2.woff)');
    });

});

describe('downloadFont', () => {

    test('works as expected', () => {
        const job: any = {
            remoteFont: {
                urlObject: url.parse('https://example.com/font.woff'),
                format: 'woff',
            },
            css: {
                path: '/var/project/public/style.css',
            },
            font: {
                path: '/var/project/public/font/font1.woff',
                filename: 'font1.woff',
            },
        };
        const stubFileInfo = {
            size: 123321,
        };
        const downloader = {
            download: sinon.fake.returns(Promise.resolve(stubFileInfo)),
        };

        const result = functions.downloadFont(job, true, <any>downloader);

        expect(result).resolves.toMatchObject({
            job,
            download: {
                size: stubFileInfo.size,
            },
        });
        downloader.download.calledOnceWith(job.remoteFont.urlObject, job.font.path, true);
    });

});
