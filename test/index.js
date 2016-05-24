/**
 * Test.
 */

import fs from 'fs';
import path from 'path';
import test from 'ava';
import postcss from 'postcss';
import FontGrabber from '../dist/lib/font-grabber';
import postcssFontGrabber from '../dist/index';
import 'babel-polyfill';


test.beforeEach(t => {
  const mockDownloader = makeMockDownloader();

  t.context.downloader = FontGrabber.getDownloader();

  FontGrabber.setDownloader(mockDownloader);
});

test.afterEach(t => {
  FontGrabber.setDownloader(t.context.downloader);
});

//
//
//
test('process CSS', async t => {
  postcss([
    postcssFontGrabber(),
  ])
    .process(fs.readFileSync(path.join(__dirname, 'res', 'source.css')), {
      from: path.join(__dirname, 'res', 'source.css'),
      to  : path.join(__dirname, 'res', 'build.css'),
    })
    .then((result) => {
      t.is(
        fs.readFileSync(path.join(__dirname, 'res', 'expect.css'), { encoding: 'utf-8' }),
        result.css
      );

      t.pass();
    });
});

//
//
//
test('process CSS to sub directory', async t => {
  postcss([
    postcssFontGrabber({
      dirPath: path.join(__dirname, 'res', 'build'),
    }),
  ])
    .process(fs.readFileSync(path.join(__dirname, 'res', 'source.css')), {
      from: path.join(__dirname, 'res', 'source.css'),
      to  : path.join(__dirname, 'res', 'build.css'),
    })
    .then((result) => {
      t.is(
        fs.readFileSync(path.join(__dirname, 'res', 'expect_sub.css'), { encoding: 'utf-8' }),
        result.css
      );

      t.pass();
    });
});

//
//
//
test('process CSS to parent directory', async t => {
  postcss([
    postcssFontGrabber({
      dirPath: path.join(__dirname),
    }),
  ])
    .process(fs.readFileSync(path.join(__dirname, 'res', 'source.css')), {
      from: path.join(__dirname, 'res', 'source.css'),
      to  : path.join(__dirname, 'res', 'build.css'),
    })
    .then((result) => {
      t.is(
        fs.readFileSync(path.join(__dirname, 'res', 'expect_parent.css'), { encoding: 'utf-8' }),
        result.css
      );

      t.pass();
    });
});

/**
 *
 * @returns {*}
 */
function makeMockDownloader () {
  return {
    download (urlObj, filePath) {
      return Promise.resolve();
    },
  };
}

