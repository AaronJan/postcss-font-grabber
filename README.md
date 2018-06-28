# PostCSS Font Grabber

<p align="center">
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/v/postcss-font-grabber.svg?style=flat-square" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/dt/postcss-font-grabber.svg?style=flat-square" alt="Downloads"></a>
  <a href="https://travis-ci.org/AaronJan/postcss-font-grabber"><img src="https://img.shields.io/travis/AaronJan/postcss-font-grabber.svg?style=flat-square" alt="Build Status"></a>
  <a href="https://coveralls.io/github/AaronJan/postcss-font-grabber?branch=master"><img src="https://img.shields.io/coveralls/AaronJan/postcss-font-grabber.svg?style=flat-square" alt="Coverage Status"></a>
  <a href="https://www.npmjs.com/package/postcss-font-grabber"><img src="https://img.shields.io/npm/l/postcss-font-grabber.svg?style=flat-square" alt="License"></a>
</p>

> `2.0` is coming!

This is a [PostCSS](https://github.com/postcss/postcss) plugin, only do one thing:

Grab remote font in `@font-face`, download it and update your `CSS`.

Boom.


## Installation

```
npm install postcss-font-grabber --save-dev
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
gulp.task('css', function () {
    var postcss            = require('gulp-postcss');
    var postcssFontGrabber = require('postcss-font-grabber');

    return gulp.src('src/**/*.css')
        .pipe(postcss([
            postcssFontGrabber() // I'm here
        ]))
        .pipe(gulp.dest('build/'));
});
```


### Webpack

Use [postcss-loader](https://github.com/postcss/postcss-loader):

```javascript
import postcssFontGrabber from 'postcss-font-grabber';

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
            postcssFontGrabber() // I'm here
        ];
    }
}
```


## Options

Function `postcssFontGrabber` takes an object of options as parameter:

```javascript
postcssFontGrabber({ dirPath: '../css/build/font/' })
```


### dirPath

Type: `String`

The folder to save font file to, it's the same folder as the output `CSS` file is in by default.


## License

Licensed under [the APACHE LISENCE 2.0](http://www.apache.org/licenses/LICENSE-2.0).


## Credits

[PostCSS](https://github.com/postcss/postcss)

[PostCSS Copy Assets](https://github.com/shutterstock/postcss-copy-assets)
