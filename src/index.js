/**
 * Postcss Font Grabber
 *
 * @license        Apache 2.0
 * @copyright  (c) 2016, AaronJan
 * @author         AaronJan <https://github.com/AaronJan/postcss-font-grabber>
 */

import postcss from 'postcss';
import path from 'path';
import url from 'url';
import Downloader from './lib/downloader';
import * as regexes from './lib/regexes';
import includes from 'lodash/fp/includes';

/**
 *
 */
class FontGrabber {
  /**
   *
   */
  static downloader = new Downloader();

  /**
   *
   * @param postcssOpts
   */
  static validatePostcssOptions (postcssOpts) {
    if (! postcssOpts.from) {
      throw new Error('postcss-font-grabber requires postcss "from" option.');
    }
    if (! postcssOpts.to) {
      throw new Error('postcss-font-grabber requires postcss "to" option.');
    }
  }

  /**
   *
   * @param iterator
   * @returns {function()}
   */
  static iterateCSSRuleWith (iterator) {
    return (rule) => {
      rule.each(iterator);
    };
  }

  /**
   *
   * @param src
   * @returns {*}
   */
  static generateUrlObjectFromSrc (src) {
    const result = regexes.extractUrlFromFontFaceSrcRegex.exec(src);

    return (
      result === null ?
      null :
      url.parse(result[2])
    );
  }

  /**
   *
   * @param kept
   * @param value
   * @returns {*}
   */
  static keepUniqueAndValidFontFileUrlObject (kept, value) {
    if (
      value &&
      regexes.validFontExtensionRegex.test(value.pathname) &&
      (! includes(kept, value))
    ) {
      kept.push(value);
    }

    return kept;
  }

  /**
   *
   * @param downloadDir
   * @returns {function()}
   */
  static makeFontDownloadJobDispatcher (downloadDir) {
    return (fontUrlObj) => {
      const filename = fontUrlObj.pathname.split('/').pop();

      return {
        url     : fontUrlObj.href,
        filename: filename,
        promise : FontGrabber.downloader.download(
          fontUrlObj,
          path.join(downloadDir, filename)
        ),
      };
    };
  }

  /**
   *
   * @param opts
   * @param postcssOpts
   */
  static reviewOptions (opts, postcssOpts) {
    if (! opts.dirPath) {
      opts.dirPath = path.dirname(postcssOpts.to);
    }
  }

  /**
   * Skip Font-Face Postcss object that is:
   *   not a Declaration
   *   or doesn't contain `src` property
   *   or doesn't contain remote font file
   *
   * @param decl
   * @returns {boolean}
   */
  static shouldProcessThisFontFaceDeclaration (decl) {
    if (decl.type !== 'decl') {
      return false;
    } else if (decl.prop !== 'src') {
      return false;
    } else if (regexes.isFontFaceSrcContainsRemoteUrlRegex.test(decl.value) === false) {
      return false;
    }

    return true;
  }

  /**
   * Download font file and update output CSS rule correspondingly.
   *
   * @param decl Postcss Declaration object.
   * @param saveDirPath
   * @param cssFilePath
   * @returns {Promise}
   */
  static downloadFontAndUpdateDeclaration (decl, saveDirPath, cssFilePath) {
    //
    // One src could have multiple `url()`, they are separated with `,`.
    //
    const srcUrls = decl.value
      .split(',')
      .map(value => value.replace(regexes.trimRegex, ''));

    //
    // Use `srcUrls` to generate Url objects for download.
    // This will check the validation of font url, and only keep which is
    // unique.
    const fontFileUrlObjects = srcUrls
      .map(FontGrabber.generateUrlObjectFromSrc)
      .reduce(FontGrabber.keepUniqueAndValidFontFileUrlObject, []);

    //
    // If there is no font file needs to be download, end this function
    // Must return a promise.
    //
    if (fontFileUrlObjects.length === 0) {
      return Promise.resolve();
    }

    //
    // Download font to `saveDirPath` using Url objects **concurrently**
    // and return `job` objects that contain:
    //
    //   url: the full url needs to be replaced
    //   filename: the name of the saved file
    //   promise: a promise will be fulfilled when download completed
    //
    const jobs = fontFileUrlObjects.map(
      FontGrabber.makeFontDownloadJobDispatcher(saveDirPath)
    );

    return Promise.all(jobs.map(job => job.promise))
      .then(() => {
        //
        // The font file might be saved in a different directory to the CSS
        // file,  before replace the CSS rule, we have to derive the relative
        // path between them.
        //
        const relativePath = path.relative(
          path.dirname(cssFilePath),
          saveDirPath
        );

        //
        // Replace CSS rule with every font that downloaded.
        //
        jobs.map(job => {
          decl.value = decl.value.replace(
            job.url,

            //
            // Replace `\\` to `/` for Windows compatibility.
            //
            path.join(relativePath, job.filename).replace('\\', '/')
          );
        });
      });
  }

  /**
   *
   * @param downloader
   */
  static setDownloader (downloader) {
    FontGrabber.downloader = downloader;
  }

  /**
   *
   * @returns {Downloader}
   */
  static getDownloader () {
    return FontGrabber.downloader;
  }

  /**
   * Make handle function for plugin to call with.
   *
   * @param opts
   * @returns {Function}
   */
  static makePluginHandler (opts = {}) {
    return function (css, result) {
      //
      // Get the options from Postcss for later use.
      //
      let postcssOpts = result.opts;

      //
      // If something is missing in the Postcss options, throw an Error.
      //
      FontGrabber.validatePostcssOptions(postcssOpts);

      //
      // Review options for Font Grabber (This may modify them).
      //
      FontGrabber.reviewOptions(opts, postcssOpts);

      //
      // Process every Declaration that matchs rule `font-face` concurrently.
      //
      let processPromises = [];

      const declarationProcessor = (decl) => {
        if (FontGrabber.shouldProcessThisFontFaceDeclaration(decl)) {
          processPromises.push(
            FontGrabber.downloadFontAndUpdateDeclaration(decl, opts.dirPath, postcssOpts.to)
          );
        }
      };

      css.walkAtRules(/font-face/, FontGrabber.iterateCSSRuleWith(declarationProcessor));

      return (
        processPromises.length === 0 ?
        Promise.resolve() :
        Promise.all(processPromises)
      );
    };
  }
}


//
// Expose default method.
//
export default postcss.plugin('postcss-font-grabber', (opts) => {
  return FontGrabber.makePluginHandler(opts);
});

//
// Expose FontGrabber class for testing use.
//
export { FontGrabber };