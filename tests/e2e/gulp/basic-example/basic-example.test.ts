import gulp from 'gulp';
import postcss from 'gulp-postcss';
import { join } from 'path';
import { sync as rimraf } from 'rimraf';
import { Readable } from 'stream';
import { postcssFontGrabber, FontSpec } from '../../../../src';

const fixturesDirectoryPath = join(__dirname, 'fixtures');
const OutputsDirectoryPath = join(__dirname, 'outputs/dist');

const CssSrcDir = fixturesDirectoryPath;
const GulpDestDir = OutputsDirectoryPath;
const CssDestDir = join(OutputsDirectoryPath, '/css');
const CssDestFontDir = join(OutputsDirectoryPath, '/css/font');

describe('Basic Gulp integration example', () => {
  beforeEach(() => rimraf(OutputsDirectoryPath));
  afterEach(() => rimraf(OutputsDirectoryPath));

  it('should works', done => {
    const expectedFontUrls = [
      'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgVxFIzIXKMnyrYk.woff2',
      'https://fonts.gstatic.com/s/notosanstc/v11/-nFlOG829Oofr2wohFbTp9i9WyEKIfVZ15Ls5XOFrksA2xrfz7uqxBF_ije-Lcrp9hfGsGeZ-W5oyw.0.woff2',
      'https://fonts.gstatic.com/s/pottaone/v3/FeVSS05Bp6cy7xI-YfxQ2J5hm24c1sY_XjjYC1QMPbpH11Hj8t620eOL.3.woff2',
    ];
    const expectedCssFiles = [
      join(CssSrcDir, 'desktop.css'),
      join(CssSrcDir, 'mobile.css'),
    ];

    const mockDownloader = jest.fn().mockImplementation(fontSpec => {
      const data = Readable.from(['font']);

      return {
        data,
        mimeType: undefined,
      };
    });

    gulp
      .src(join(CssSrcDir, `/**/*.css`))
      .pipe(
        postcss([
          postcssFontGrabber({
            cssSrc: CssSrcDir,
            cssDest: CssDestDir,
            fontDest: CssDestFontDir,
            downloader: mockDownloader,
          }),
        ]),
      )
      .pipe(gulp.dest(GulpDestDir))
      .on('end', () => {
        expect(mockDownloader.mock.calls.length).toBe(3);
        for (const call of mockDownloader.mock.calls) {
          const fontSpec: FontSpec = call[0];
          expect(
            expectedFontUrls.includes(fontSpec.parsedSrc.urlObject.href),
          ).toBeTruthy();
          expect(
            expectedCssFiles.includes(fontSpec.css.sourceFile),
          ).toBeTruthy();
        }

        done();
      });
  });
});
