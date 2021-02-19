import * as rollup from 'rollup';
import postcss from 'rollup-plugin-postcss';
import { join } from 'path';
import { postcssFontGrabber } from '../../../../src';
import { Readable } from 'stream';
import { sync as rimraf } from 'rimraf';

const fixturesDirectoryPath = join(__dirname, 'fixtures');
const OutputsDirectoryPath = join(__dirname, 'outputs/dist');

const OutputDestDir = OutputsDirectoryPath;
const CssDestFontDir = join(OutputsDirectoryPath, '/css/font');

describe('rollup - basic example', () => {
  beforeEach(() => rimraf(OutputsDirectoryPath));
  afterEach(() => rimraf(OutputsDirectoryPath));

  it('should works', async done => {
    const mockDownloader = jest.fn().mockImplementation(fontSpec => {
      const data = Readable.from([
        `file:${fontSpec.css.sourceFile}\n`,
        `url:${fontSpec.parsedSrc.urlObject.href}`,
      ]);

      return {
        data,
        mimeType: undefined,
      };
    });

    const bundle = await rollup.rollup({
      input: join(fixturesDirectoryPath, 'app.js'),
      output: {},
      plugins: [
        postcss({
          plugins: [
            postcssFontGrabber({
              cssDest: OutputDestDir,
              fontDest: CssDestFontDir,
              downloader: mockDownloader,
            }),
          ],
        }),
      ],
    });
    const { output } = await bundle.write({
      file: join(OutputDestDir, 'bundle.js'),
      format: 'cjs',
    });

    expect(output).toHaveLength(1);

    done();
  });
});
