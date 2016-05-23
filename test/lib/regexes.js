/**
 *
 */
import test from 'ava';
import * as regexes from '../../src/lib/regexes';

test('extractUrlFromFontFaceSrcRegex', t => {
  t.is(
    'http://dummy.com',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url('http://dummy.com')")
  );
  t.is(
    'http://dummy.com',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url ('http://dummy.com')")
  );
  t.is(
    'http://dummy.com',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url (\"http://dummy.com\")")
  );
  t.is(
    'https://dummy.com',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url ('https://dummy.com')")
  );

  t.is(
    'http://dummy.com/dummy.html',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url('http://dummy.com/dummy.html')")
  );
  t.is(
    'http://dummy.com/dummy.html',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url ('http://dummy.com/dummy.html')")
  );
  t.is(
    'http://dummy.com/dummy.html',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url (\"http://dummy.com/dummy.html\")")
  );
  t.is(
    'https://dummy.com/dummy.html',
    execRegex(regexes.extractUrlFromFontFaceSrcRegex, 2, "url ('https://dummy.com/dummy.html')")
  );
});

test('validFontExtensionRegex', t => {
  t.true(regexes.validFontExtensionRegex.test('file.ttf'));
  t.true(regexes.validFontExtensionRegex.test('file.otf'));
  t.true(regexes.validFontExtensionRegex.test('file.woff'));
  t.true(regexes.validFontExtensionRegex.test('file.eot'));
  t.true(regexes.validFontExtensionRegex.test('file.svg'));

  t.false(regexes.validFontExtensionRegex.test('file.jpg'));
  t.false(regexes.validFontExtensionRegex.test('file.png'));
  t.false(regexes.validFontExtensionRegex.test('file.zip'));
});

test('trimRegex', t => {
  t.is('string', '  string     '.replace(regexes.trimRegex, ''));
});

test('isFontFaceSrcContainsRemoteUrlRegex', t => {
  t.true(regexes.isFontFaceSrcContainsRemoteUrlRegex.test("url('http://dummy.com')"));
  t.true(regexes.isFontFaceSrcContainsRemoteUrlRegex.test("url('https://dummy.com')"));
  t.true(regexes.isFontFaceSrcContainsRemoteUrlRegex.test('url("https://dummy.com")'));
  t.true(regexes.isFontFaceSrcContainsRemoteUrlRegex.test('  url ("https://dummy.com")'));
  t.true(regexes.isFontFaceSrcContainsRemoteUrlRegex.test('  url ( "https://dummy.com" )'));
});

function execRegex (regex, pluckIndex, str) {
  const result = regex.exec(str);

  return (
    result === null ?
    null :
    result[pluckIndex]
  );
}
