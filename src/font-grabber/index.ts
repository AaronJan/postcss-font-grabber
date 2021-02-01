import EventEmitter from 'events';
import { Result as PostcssResult, Plugin as PostcssPlugin } from 'postcss';
import { debuglog } from 'util';
import path from 'path';

import { PluginOptions, FontSpec, Downloader } from '../types';
import {
  isRemoteFontFaceDeclaration,
  calculateFontSpecs,
  saveFile,
  calculateRelativePath,
  getNewDeclarationValue,
  getSubDirectoryPath,
} from './functions';
import { makeDirectoryRecursively, getOrDefault } from '../helpers';
import { RuleProcessed } from '../constants';
import { downloadFontFile } from './download';
import { PostcssFontGrabberError } from './errors';

const debug = debuglog('PostcssFontGrabber - FontGrabber');

export function resolvePathIfNotUndefined(
  pathOrUndefined?: string,
): string | undefined {
  return pathOrUndefined ? path.resolve(pathOrUndefined) : undefined;
}

export class FontGrabber {
  protected downloader: Downloader;
  protected doneEmitter: EventEmitter;

  protected cssSourceDirectoryPath?: string;
  protected cssDestinationDirectoryPath?: string;
  protected fontDirectoryPath?: string;

  constructor({
    cssSrc,
    cssDest,
    fontDest,
    downloader = downloadFontFile,
  }: PluginOptions) {
    this.doneEmitter = new EventEmitter();
    this.downloader = downloader;
    this.cssSourceDirectoryPath = resolvePathIfNotUndefined(cssSrc);
    this.cssDestinationDirectoryPath = resolvePathIfNotUndefined(cssDest);
    this.fontDirectoryPath = resolvePathIfNotUndefined(fontDest);
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

  createPlugin(): PostcssPlugin {
    return {
      postcssPlugin: 'postcss-font-grabber',
      prepare: result => {
        const postcssResultOptions = result.opts;
        const cssSourceDirectoryPath =
          this.cssSourceDirectoryPath ?? postcssResultOptions.from;
        const cssDestinationDirectoryPath =
          this.cssDestinationDirectoryPath ?? postcssResultOptions.to;
        if (cssSourceDirectoryPath === undefined) {
          throw new PostcssFontGrabberError(
            `Must know where the source CSS files are stored to calculate relative URLs.`,
          );
        }
        if (cssDestinationDirectoryPath === undefined) {
          throw new PostcssFontGrabberError(
            `Could not determine where the processed CSS files are stored, so postcss-font-grabber does not know how to update your CSS rules.`,
          );
        }

        // Font directory path
        const fontDirectoryPath =
          this.fontDirectoryPath ?? cssDestinationDirectoryPath;

        const downloaded: Record<
          string,
          {
            filePath: string;
            filename: string;
            format: string | null;
            fontSpec: FontSpec;
          }
        > = {};

        return {
          Once: async () => {
            await makeDirectoryRecursively(fontDirectoryPath);
          },
          OnceExit: () => {
            // TODO: support callback
          },
          AtRule: async rule => {
            if (rule[RuleProcessed]) {
              return;
            }
            if (rule.name !== 'font-face') {
              return;
            }
            // Mark it as processed.
            rule[RuleProcessed] = true;

            for (const node of rule.nodes) {
              if (node.type !== 'decl') {
                continue;
              }

              if (!isRemoteFontFaceDeclaration(node)) {
                continue;
              }

              const fontSpecs = calculateFontSpecs(node);
              for (const fontSpec of fontSpecs) {
                const fontUrlString = fontSpec.parsedSrc.urlObject.href;

                // Download the font file if it hasn't been downloaded yet.
                if (!downloaded[fontUrlString]) {
                  // download
                  const downloadResult = await this.downloader(fontSpec);
                  const details = await saveFile({
                    downloadResult,
                    fontSpec,
                    fontDirectoryPath,
                  });
                  downloaded[fontUrlString] = {
                    ...details,
                    fontSpec,
                  };
                }

                const downloadDetails = downloaded[fontUrlString];
                const cssFileDirectoryRelativePath = getSubDirectoryPath(
                  cssSourceDirectoryPath,
                  downloadDetails.fontSpec.css.sourceFile,
                );
                const relativePath = calculateRelativePath({
                  cssDirectoryPath: cssDestinationDirectoryPath,
                  cssFileDirectoryRelativePath,
                  fontFilePath: downloadDetails.filePath,
                });

                // Replace the value.
                node.value = getNewDeclarationValue({
                  value: node.value,
                  oldUrl: fontUrlString,
                  newUrl: relativePath,
                });
              }
            }
          },
        };
      },
    };
  }
}
