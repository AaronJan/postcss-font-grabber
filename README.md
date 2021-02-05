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

A [`postcss`](https://github.com/postcss/postcss) plugin, it grabs remote font files and update your CSS, just like that.

> `postcss-font-grabber` `v3.x` only works with `postcss` `v8`，for `postcss` `v7`, please take a look at the [`v2.x`](https://github.com/AaronJan/postcss-font-grabber/tree/v1.x) branch.

## Motivation

You may not want to use remote fonts, because:

- It may expose your internal project
- Font services could be unstable sometimes
- You can do more things with local font files
- GDPR compliance

## Features

- Standalone without any dependency
- Written in TypeScript
- Infer font file extension from HTTP response header (Thanks to [@FTWinston](https://github.com/FTWinston))
- Support custom download function (the `download` option)

## Installation

> Requires: `Node >= 10.0`, `postcss 8.*`

```
npm install postcss postcss-font-grabber --save-dev
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
          // postcss-font-grabber needs to know the CSS output
          // directory in order to calculate the new font URL.
          cssDest: 'dist/',
          fontDest: 'dist/fonts/',
        }),
      ]),
    )
    .pipe(gulp.dest('dist/'));
});
```

### With Webpack

> This example is using `Webpack 5` with these packages:
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
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        use: ['file-loader'],
      },
    ],
  },
};
```

`postcss.config.js`:

```javascript
import { postcssFontGrabber } from 'postcss-font-grabber';

module.exports = {
  plugins: [
    postcssFontGrabber({
      cssSrc: 'src/css/',
      // When using with `Webpack` you must set `cssDest` as the same as `cssSrc`,
      // since `Webpack` kept updated CSS files in memory, your source files will
      // be fine.
      // When `PostCSS` is done its job, `Webpack` then use `file-loader` to
      // embedding font file references into the dist file.
      cssDest: 'src/css/',
      fontDest: 'tmp/css/fonts/',
    }),
  ],
};
```

### With Only PostCSS

`PostCSS-Font-Grabber` will use `from` and `to` options of `PostCSS` setting as the default options of `cssSrc` (`from`), `cssDest` and `fontDest` (`to`).

## Options

|   Name   |                                   Type                                   | Default                              | Description                                                                                 |
| :------: | :----------------------------------------------------------------------: | :----------------------------------- | :------------------------------------------------------------------------------------------ |
|  cssSrc  |                                 `string`                                 | `opts.from` from `PostCSS`'s setting | The root directory path of all CSS files                                                    |
| cssDest  |                                 `string`                                 | `opts.to` from `PostCSS`'s setting   | The directory where the transpiled CSS files are in                                         |
| fontDest |                                 `string`                                 | the same as `cssDest`                | The directory where the downloaded fonts stored                                             |
| download | `(fontSpec: FontSpec) => Promise<{ data: Readable, mimeType?: string }>` | -                                    | Custom function to download font files. Maybe you want to customize UserAgent or something? |

## TypeScript

You can import types if you need to (only in TypeScript):

```typescript
import { FontSpec, Downloader, DownloadResult } from 'postcss-font-grabber';
```

## License

Licensed under [the APACHE LISENCE 2.0](http://www.apache.org/licenses/LICENSE-2.0).

## Credits

[PostCSS](https://github.com/postcss/postcss)

[PostCSS Copy Assets](https://github.com/shutterstock/postcss-copy-assets)

[Issue Reporters](https://github.com/AaronJan/postcss-font-grabber/issues)
