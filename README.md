<h1 align=center>
    PostCSS Font Grabber
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/v/postcss-font-grabber.svg?style=flat-square" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/dt/postcss-font-grabber.svg?style=flat-square" alt="Downloads"></a>
  <a href="https://github.com/aaronjan/postcss-font-grabber"><img src="https://github.com/aaronjan/postcss-font-grabber/workflows/Node.js%20CI/badge.svg?branch=master" alt="Build status" /></a>
  <a href="https://coveralls.io/github/AaronJan/postcss-font-grabber?branch=master"><img src="https://img.shields.io/coveralls/AaronJan/postcss-font-grabber.svg?style=flat-square" alt="Coverage Status"></a>
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/l/postcss-font-grabber.svg?style=flat-square" alt="License"></a>
</p>

> `3.x` is under active development.

A [`PostCSS`](https://github.com/postcss/postcss) plugin, it only does one thing and good at it: **download remote fonts, and update the corresponding `@font-face` rules**.

> `postcss-font-grabber` `v3.x` only works with `postcss` `v8`，for `postcss` `v7`, please take a look at the [`v2.x`](https://github.com/AaronJan/postcss-font-grabber/tree/v1.x).

## Motivation

You may not want to use remote fonts, because:

- it may expose your internal project
- font service may be slow for your users
- you can do more things with local font files
- GDPR compliance

## Features

- Written in TypeScript
- Standalone without any dependency
- Download font files concurrently

## Installation

> Requires: `Node >= 8.0`, `postcss 8.*`

```
npm install postcss-font-grabber --save-dev
```

## Usages

### With Gulp

```javascript
gulp.task('css', () => {
  const postcss = require('gulp-postcss');
  const { postcssFontGrabber } = require('postcss-font-grabber');

  return gulp
    .src('src/css/**/*.css')
    .pipe(
      postcss([
        postcssFontGrabber({
          // Because PostCSS-Font-Grabber can't get the paths outside itself, you
          // have to set them manually.
          cssSrc: 'src/css/',
          cssDest: 'dist/',
          fontDir: 'dist/fonts/',
          mkdir: true,
        }),
      ]),
    )
    .pipe(gulp.dest('dist/'));
});
```

### With Webpack

> This example is using `Webpack 4` with these packages:
>
> - [postcss-loader](https://github.com/postcss/postcss-loader)
> - [css-loader](https://github.com/webpack-contrib/css-loader)
> - [file-loader](https://github.com/webpack-contrib/file-loader)

`webpack.config.js`:

```javascript
import path from 'path';

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader'],
      },
    ],
  },
};
```

`postcss.config.js`:

```javascript
import postcssFontGrabber from 'postcss-font-grabber';

module.exports = {
  plugins: [
    postcssFontGrabber({
      cssSrc: 'src/css/',
      // When using with `Webpack` you must set `cssDest` as the same as `cssSrc`
      // since `Webpack` doesn't output CSS files directly, when done with
      // `PostCSS`, `Webpack` use `file-loader` to transpile local file
      // references in the CSS.
      cssDest: 'src/css/',
      fontDir: 'tmp/css/fonts/',
    }),
  ],
};
```

### With Only PostCSS

`PostCSS-Font-Grabber` will use `from` and `to` options of `PostCSS` setting as the default options of `cssSrc` (`from`), `cssDest` and `fontDir` (`to`).

## Options

Function `postcssFontGrabber` takes an object of options as parameter:

```javascript
postcssFontGrabber({
  cssSrc: 'src/css/',
  cssDest: 'dist/',
  fontDir: 'dist/fonts/',
  mkdir: true,
});
```

|  Name   |   Type    | Default                              | Description                                                     |
| :-----: | :-------: | :----------------------------------- | :-------------------------------------------------------------- |
| cssSrc  | {string}  | `opts.from` from `PostCSS`'s setting | The root directory path of all CSS files                        |
| cssDest | {string}  | `opts.to` from `PostCSS`'s setting   | The directory where the transpiled CSS files are in             |
| fontDir | {string}  | the same as `cssDest`                | The directory where the downloaded fonts stored                 |
|  mkdir  | {boolean} | `true`                               | whether to create non-existing directories automatically or not |

## Dig Deeper

You can get the **metadata** of all execution details of `PostCSS-Font-Grabber`:

```javascript
import postcss from 'gulp-postcss';
import { makeInstance } from 'postcss-font-grabber';

gulp.task('default', () => {
  // Create instance manually:
  const fontGrabber = makeInstance({
    cssSrc: 'src/css/',
    cssDest: 'dist/',
    fontDir: 'dist/fonts/',
    mkdir: true,
  });

  // Register a callback:
  fontGrabber.onDone(meta => {
    console.log('meta', JSON.stringify(meta, null, '    '));
  });

  return gulp
    .src('src/css/**/*.css')
    .pipe(postcss([fontGrabber.makeTransformer()]))
    .pipe(gulp.dest('dist/'));
});
```

### Metadata Format

Here is an example:

```javascript
// Importing module just for demonstration purpose, because the metadata contains URL object.
import url from 'url';

{
    "jobResults": [
        {
            "job": {
                "remoteFont": {
                    "urlObject": url.parse('https://example.com'),
                    "format": "woff2"
                },
                "css": {
                    "sourcePath": "/var/project/public/css/google.css",
                    "destinationDirectoryPath": "/var/project/public/dist/css/fonts"
                },
                "font": {
                    "path": "/var/project/public/dist/css/fonts/ea8XadU7WuTxEub_NdWn8WZFuVs.woff2",
                    "filename": "ea8XadU7WuTxEub_NdWn8WZFuVs.woff2"
                }
            },
            "download": {
                "size": 14312
            }
        },
        /* More JobResults */
    ]
}
```

## License

Licensed under [the APACHE LISENCE 2.0](http://www.apache.org/licenses/LICENSE-2.0).

## Credits

[PostCSS](https://github.com/postcss/postcss)

[PostCSS Copy Assets](https://github.com/shutterstock/postcss-copy-assets)

[Issue Reporters](https://github.com/AaronJan/postcss-font-grabber/issues)
