import url from 'url';
import crypto from 'crypto';

import * as functions from './functions';

describe('isRemoteFontFaceDeclaration', () => {
  test("Node's type doesn't match", () => {
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

  test("doesn't contain a remote font URI", () => {
    const node: any = {
      type: 'decl',
      prop: 'src',
      value:
        " local('Tangerine Regular'), local('Tangerine-Regular'), url(../font-file/font.woff2) format('woff2')",
    };

    expect(functions.isRemoteFontFaceDeclaration(node)).toBeFalsy();
  });

  test('works as expected', () => {
    const node: any = {
      type: 'decl',
      prop: 'src',
      value:
        " local('Tangerine Regular'), local('Tangerine-Regular'), url(https://fonts.gstatic.com/s/tangerine/v9/IurY6Y5j_oScZZow4VOxCZZMprNA4A.woff2) format('woff2')",
    };

    expect(functions.isRemoteFontFaceDeclaration(node)).toBeTruthy();
  });
});

describe('getFontFilename', () => {
  test('corrupt URL object', () => {
    const stubUrl = 'https://example.com';
    const stubUrlMd5 = crypto
      .createHash('md5')
      .update(stubUrl)
      .digest()
      .toString('hex');

    const urlObject: any = {
      protocol: 'https',
      hostname: 'example.com',
    };

    expect(functions.getFontFilename(urlObject)).toBe(stubUrlMd5);
  });

  test("URL object's `pathname` is an empty string", () => {
    const stubUrl = 'https://example.com';
    const stubUrlMd5 = crypto
      .createHash('md5')
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

  test('URL objects `pathname` contains no extension', () => {
    const stubUrl = 'https://example.com/font';
    const stubUrlMd5 = crypto
      .createHash('md5')
      .update(stubUrl)
      .digest()
      .toString('hex');

    const urlObject: any = {
      protocol: 'https',
      hostname: 'example.com',
      pathname: 'font',
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

describe('guessFormatFromUrl', () => {
  test('empty pathname', () => {
    const urlObject: any = {};

    expect(functions.guessFormatFromUrl(urlObject)).toBeUndefined();
  });

  test('various extensions - embedded-opentype', () => {
    const urlObject: any = {
      pathname: '/folder/font.eot',
    };

    expect(functions.guessFormatFromUrl(urlObject)).toBe('embedded-opentype');
  });

  test('various extensions - woff', () => {
    const urlObject: any = {
      pathname: '/folder/font.woff',
    };

    expect(functions.guessFormatFromUrl(urlObject)).toBe('woff');
  });

  test('various extensions - woff2', () => {
    const urlObject: any = {
      pathname: '/folder/font.woff2',
    };

    expect(functions.guessFormatFromUrl(urlObject)).toBe('woff2');
  });

  test('various extensions - truetype', () => {
    const urlObject: any = {
      pathname: '/folder/font.ttf',
    };

    expect(functions.guessFormatFromUrl(urlObject)).toBe('truetype');
  });

  test('various extensions - svg', () => {
    const urlObject: any = {
      pathname: '/folder/font.svg',
    };

    expect(functions.guessFormatFromUrl(urlObject)).toBe('svg');
  });

  test('unknow extension', () => {
    const urlObject: any = {
      pathname: '/folder/font.jpg',
    };

    expect(functions.guessFormatFromUrl(urlObject)).toBeUndefined();
  });
});

describe('parseSrcString', () => {
  test('quote compatibility', () => {
    const srcWithDoubleQuote =
      'url("https://example.com/folder/font.woff") format("woff2")';
    expect(functions.parseSrcString(srcWithDoubleQuote)).toEqual({
      urlObject: url.parse('https://example.com/folder/font.woff'),
      format: 'woff2',
    });

    const srcWithSingleQuote =
      "url('https://example.com/folder/font.woff') format('woff2')";
    expect(functions.parseSrcString(srcWithSingleQuote)).toEqual({
      urlObject: url.parse('https://example.com/folder/font.woff'),
      format: 'woff2',
    });

    const srcWithoutQuote =
      'url(https://example.com/folder/font.woff) format(woff2)';
    expect(functions.parseSrcString(srcWithoutQuote)).toEqual({
      urlObject: url.parse('https://example.com/folder/font.woff'),
      format: 'woff2',
    });
  });

  test('no format', () => {
    const src = 'url(https://example.com/folder/font.woff) ';

    expect(functions.parseSrcString(src)).toEqual({
      urlObject: url.parse('https://example.com/folder/font.woff'),
      format: 'woff',
    });
  });

  test("can't determine format", () => {
    const src = 'url(https://example.com/folder/font) ';

    expect(functions.parseSrcString(src)).toEqual({
      urlObject: url.parse('https://example.com/folder/font'),
      format: undefined,
    });
  });
});

describe('getNewDeclarationValue', () => {
  test('resolves with unix path separators', () => {
    const value = "url(https://fonts.gstatic.com/s/notosanstc/v11/-nFlOG829Oofr2wohFbTp9i9WyEKIfVZ15Ls5XOFrksA2xrfz7uqxBF_ije-Lcrp9hfGsGeZ-W5oyw.0.woff2) format('woff2')"
    const oldUrl = "https://fonts.gstatic.com/s/notosanstc/v11/-nFlOG829Oofr2wohFbTp9i9WyEKIfVZ15Ls5XOFrksA2xrfz7uqxBF_ije-Lcrp9hfGsGeZ-W5oyw.0.woff2";
    const newUrl = "../../outputs/dist/css/font/b2e443c6bc8eb92ed319c5f3ea877643.woff2";

    expect(functions.getNewDeclarationValue({
      value,
      oldUrl,
      newUrl
    })).toEqual("url(../../outputs/dist/css/font/b2e443c6bc8eb92ed319c5f3ea877643.woff2) format('woff2')")
  });

  test('resolves with windows path separators', () => {
    const value = "url(https://fonts.gstatic.com/s/notosanstc/v11/-nFlOG829Oofr2wohFbTp9i9WyEKIfVZ15Ls5XOFrksA2xrfz7uqxBF_ije-Lcrp9hfGsGeZ-W5oyw.0.woff2) format('woff2')"
    const oldUrl = "https://fonts.gstatic.com/s/notosanstc/v11/-nFlOG829Oofr2wohFbTp9i9WyEKIfVZ15Ls5XOFrksA2xrfz7uqxBF_ije-Lcrp9hfGsGeZ-W5oyw.0.woff2";
    const newUrl = "..\\..\\outputs\\dist\\css\\font\\b2e443c6bc8eb92ed319c5f3ea877643.woff2";

    expect(functions.getNewDeclarationValue({
      value,
      oldUrl,
      newUrl
    })).toEqual("url(../../outputs/dist/css/font/b2e443c6bc8eb92ed319c5f3ea877643.woff2) format('woff2')")
  });
});
