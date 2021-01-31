import EventEmitter from 'events';
import {
  Result as PostcssResult,
  Plugin as PostcssPlugin,
  Declaration as PostcssDeclaration,
} from 'postcss';
import { debuglog } from 'util';
import url from 'url';

import {
  PluginSettings,
  Meta,
  Job,
  JobResult,
  DoneCallback,
  PostcssChildNodeProcessor,
  FontDownloader,
} from '../contracts';
import {
  processDeclaration,
  isRemoteFontFaceDeclaration,
  downloadFont,
  calculateCssOutputDirectoryPath,
} from './functions';
import {
  unique,
  md5,
  makeDirectoryRecursively,
  defaultValue,
  getOrDefault,
} from '../helpers';

const debug = debuglog('PostcssFontGrabber - FontGrabber');

export class FontGrabber {
  protected doneEmitter: EventEmitter;
  protected downloadJobs: void[];
  protected settings: PluginSettings;
  protected fontDownloader: FontDownloader;

  constructor(settings: PluginSettings) {
    this.doneEmitter = new EventEmitter();
    this.settings = settings;
    this.fontDownloader = settings.fontDownloader ?? downloadFont;
    this.downloadJobs = [];
  }

  protected done(jobResults: JobResult[]) {
    const meta: Meta = {
      jobResults: jobResults,
    };

    this.doneEmitter.emit('done', meta);
  }

  protected getOptionFromPostcssResult(
    result: PostcssResult | undefined,
    key: string,
  ): string | undefined {
    if (result === undefined) {
      return undefined;
    }

    if (result.opts === undefined) {
      return undefined;
    }

    return getOrDefault<string | undefined>(<any>result.opts, key, undefined);
  }

  makeTransformer(): PostcssPlugin {
    return {
      postcssPlugin: 'postcss-font-grabber',
      Once: (root, { result }) => {
        if (!root.source || !root.source.input.file) {
          throw new Error(`Can not determine output file path`);
        }

        debug(`CSS file: [${root.source.input.file}]`);

        const postcssOptionsTo = this.getOptionFromPostcssResult(result, 'to');

        const cssOutputToDirectory = calculateCssOutputDirectoryPath(
          root.source.input.file,
          this.settings.cssSourceDirectoryPath,
          this.settings.cssDestinationDirectoryPath,
          postcssOptionsTo,
        );
        const fontOutputToDirectory = defaultValue(
          this.settings.fontDirectoryPath,
          cssOutputToDirectory,
        );

        if (
          cssOutputToDirectory === undefined ||
          fontOutputToDirectory === undefined
        ) {
          throw new Error(`Can not determine output file path`);
        }

        debug(`css output to: [${cssOutputToDirectory}]`);
        debug(`font output to: [${fontOutputToDirectory}]`);

        const jobs: Job[] = [];
        const declarationProcessor: PostcssChildNodeProcessor = node => {
          if (isRemoteFontFaceDeclaration(node)) {
            jobs.push(
              ...processDeclaration(
                <PostcssDeclaration>node,
                root.source?.input.file as string,
                cssOutputToDirectory,
                fontOutputToDirectory,
              ),
            );
          }
        };
        root.walkAtRules(/font-face/, rule => rule.each(declarationProcessor));

        const uniqueJobs = unique(jobs, job =>
          md5(url.format(job.remoteFont.urlObject) + job.css.sourcePath),
        );

        this.createDirectoryIfWantTo(fontOutputToDirectory)
          .then(() =>
            Promise.all(uniqueJobs.map(job => this.fontDownloader(job))),
          )
          .then(jobResults => this.done(jobResults));
      },
    };
  }

  onDone(callback: DoneCallback) {
    this.doneEmitter.on('done', callback);
  }

  protected createDirectoryIfWantTo(directoryPath: string): Promise<void> {
    return this.settings.autoCreateDirectory === true
      ? makeDirectoryRecursively(directoryPath)
      : Promise.resolve();
  }
}
