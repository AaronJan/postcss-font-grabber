<h1 align=center>
    PostCSS Font Grabber
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/v/postcss-font-grabber.svg?style=flat-square" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/dt/postcss-font-grabber.svg?style=flat-square" alt="Downloads"></a>
  <a href="https://travis-ci.org/AaronJan/postcss-font-grabber"><img src="https://img.shields.io/travis/AaronJan/postcss-font-grabber.svg?style=flat-square" alt="Build Status"></a>
  <a href="https://coveralls.io/github/AaronJan/postcss-font-grabber?branch=master"><img src="https://img.shields.io/coveralls/AaronJan/postcss-font-grabber.svg?style=flat-square" alt="Coverage Status"></a>
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/l/postcss-font-grabber.svg?style=flat-square" alt="License"></a>
</p>

> 🎉 Here is the brand new `2.0` version that is completely rewritten in TypeScript (with typing), for `1.0` please see [HERE](https://github.com/AaronJan/postcss-font-grabber/tree/v1.x)

This is a [PostCSS](https://github.com/postcss/postcss) plugin, only do one thing:

Grab remote font in `@font-face`, download it and update your `CSS`.

Boom.


## Installation

> Requires: `Node >= 8.0`

```
npm install postcss-font-grabber@2.0.0-alpha.1 --save-dev
```

## Example

Before using:

```css
@font-face {
    font-family : 'beautiful-font';
    src         : url('https://font-site.com/beautiful-font.woff');
}
```

After using:

```css
@font-face {
    font-family : 'beautiful-font';
    src         : url('local-font/beautiful-font.woff');
}
```

And of cource, the `beautiful-font.woff` file is in your `local-font/` folder now.


## Usage

### Gulp

```javascript
gulp.task('css', () => {
    const postcss            = require('gulp-postcss');
    const { postcssFontGrabber } = require('postcss-font-grabber');

    return gulp.src('src/**/*.css')
        .pipe(postcss([
            postcssFontGrabber({
                cssDestinationDirectoryPath: 'dist/',
                directoryPath: 'dist/fonts/',
                autoCreateDirectory: true,
            }),
        ]))
        .pipe(gulp.dest('dist/'));
});
```


### Webpack

Use [postcss-loader](https://github.com/postcss/postcss-loader):

```javascript
import { postcssFontGrabber } from 'postcss-font-grabber';

module.exports = {
    module: {
        loaders: [
            {
                test:   /\.css$/,
                loader: "style-loader!css-loader!postcss-loader"
            },

            //
            // Let Webpack support font file
            //
            {
                test: /\.(svg|ttf|eot|woff|woff2)$/,
                loader: 'file-loader'
            }
        ]
    },
    postcss: () => {
        return [
            postcssFontGrabber({
                cssDestinationDirectoryPath: 'dist/',
                directoryPath: 'dist/fonts/',
                autoCreateDirectory: true,
            }),
        ];
    }
}
```


## Options

Function `postcssFontGrabber` takes an object of options as parameter:

```javascript
postcssFontGrabber({
    cssDestinationDirectoryPath: 'dist/',
    directoryPath: 'dist/fonts/',
    autoCreateDirectory: true,
})
```

### cssDestinationDirectoryPath

Type: `string`

TODO

### cssDestinationDirectoryPath

Type: `string`

The folder to save font file to, it's the same folder as the output `CSS` file is in by default.

### autoCreateDirectory

Type: `boolean`

Default: `true`

TODO


## Dig Deeper

You can get the **metadata** of execution details of `PostCSS-Font-Grabber`:

```javascript
import postcss from 'gulp-postcss';
import { makeInstance } from 'postcss-font-grabber';

gulp.task('default', () => {
    const fontGrabber = makeInstance({
        cssDestinationDirectoryPath: 'dist/',
        directoryPath: 'dist/fonts/',
        autoCreateDirectory: true,
    });

    fontGrabber.onDone(meta => {
        console.log('meta', JSON.stringify(meta, null, '    '));
    });

    return gulp.src('src/**/*.css')
        .pipe(postcss([
            fontGrabber.makeTransformer(),
        ]))
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
                    "targetDirectoryPath": "/var/project/public/dist/css/fonts"
                },
                "font": {
                    "path": "/var/project/public/dist/css/fonts/ea8XadU7WuTxEub_NdWn8WZFuVs.woff2",
                    "filename": "ea8XadU7WuTxEub_NdWn8WZFuVs.woff2"
                }
            },
            "download": {
                "size": 0
            }
        },
        /* More JobResults */
    ]
}
```


## TODOs

- [ ] Docs
- [ ] Fix download size
- [ ] Support calculating relative path when CSS file has it's own sub-folder


## License

Licensed under [the APACHE LISENCE 2.0](http://www.apache.org/licenses/LICENSE-2.0).


## Credits

[PostCSS](https://github.com/postcss/postcss)

[PostCSS Copy Assets](https://github.com/shutterstock/postcss-copy-assets)

[Issue Reporters](https://github.com/AaronJan/postcss-font-grabber/issues)
