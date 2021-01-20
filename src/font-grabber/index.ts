import EventEmitter from 'events';
import { Transformer as PostcssTransformer, Declaration as PostcssDeclaration } from 'postcss';
import { debuglog } from 'util';
import path from 'path';
import url from 'url';
import postcss from 'postcss';

import {
    PluginSettings,
    Meta,
    Job,
    JobResult,
    DoneCallback,
    PostcssChildNodeProcessor,
} from '../contracts';
import {
    processDeclaration,
    isRemoteFontFaceDeclaration,
    downloadFont,
    calculateCssOutputDirectoryPath,
} from './functions';
import { unique, md5, makeDirectoryRecursively, defaultValue, getOrDefault } from '../helpers';

const debug = debuglog('PostcssFontGrabber - FontGrabber');

/**
 * 
 */
export class FontGrabber {
    protected doneEmitter: EventEmitter;
    protected downloadJobs: void[];
    protected settings: PluginSettings;

    /**
     * 
     * @param {PluginSettings} settings
     */
    constructor(settings: PluginSettings) {
        this.doneEmitter = new EventEmitter();
        this.settings = settings;
        this.downloadJobs = [];
    }

    /**
     * @param {JobResult[]} jobResults
     */
    protected done(jobResults: JobResult[]) {
        const meta: Meta = {
            jobResults: jobResults,
        };

        this.doneEmitter.emit('done', meta);
    }

    /**
     * 
     * @param result 
     * @param key 
     */
    protected getOptionFromPostcssResult(result: postcss.Result | undefined, key: string): string | undefined {
        if (result === undefined) {
            return undefined;
        }

        if (result.opts === undefined) {
            return undefined;
        }

        return getOrDefault<string | undefined>(<any>result.opts, key, undefined);
    }

    /**
     * 
     */
    makeTransformer(): PostcssTransformer {
        return (root, result) => {
            debug(`CSS file: [${root.source.input.file}]`);

            const postcssOptionsTo = this.getOptionFromPostcssResult(result, 'to');

            const cssOutputToDirectory = calculateCssOutputDirectoryPath(
                root.source.input.file,
                this.settings.cssSourceDirectoryPath,
                this.settings.cssDestinationDirectoryPath,
                postcssOptionsTo
            );
            const fontOutputToDirectory = defaultValue(
                this.settings.fontDirectoryPath,
                cssOutputToDirectory
            );

            if (cssOutputToDirectory === undefined || fontOutputToDirectory === undefined) {
                throw new Error(`Can not determine output file path`);
            }

            debug(`css output to: [${cssOutputToDirectory}]`);
            debug(`font output to: [${fontOutputToDirectory}]`);

            const jobs: Job[] = [];
            const declarationProcessor: PostcssChildNodeProcessor = node => {
                if (isRemoteFontFaceDeclaration(node)) {
                    jobs.push(...processDeclaration(
                        <PostcssDeclaration>node,
                        root.source.input.file,
                        cssOutputToDirectory,
                        fontOutputToDirectory
                    ));
                }
            };
            root.walkAtRules(/font-face/, rule => rule.each(declarationProcessor));

            const uniqueJobs = unique(jobs, job => md5(url.format(job.remoteFont.urlObject) + job.css.sourcePath));

            return this.createDirectoryIfWantTo(fontOutputToDirectory)
                .then(() => Promise.all(uniqueJobs.map(job => downloadFont(job))))
                .then(jobResults => {
                    for (const jobResult of jobResults) {
                        this.updateDeclaration(jobResult);
                    }
                    this.done(jobResults)
                });
        };
    }

    /**
     * 
     * @param callback 
     */
    onDone(callback: DoneCallback) {
        this.doneEmitter.on('done', callback);
    }

    /**
     * 
     * @param directoryPath 
     */
    protected createDirectoryIfWantTo(directoryPath: string): Promise<void> {
        return this.settings.autoCreateDirectory === true ?
            makeDirectoryRecursively(directoryPath) :
            Promise.resolve();
    }

    /**
     * 
     * @param result 
     */
    protected updateDeclaration(result: JobResult) {
        const originalUri = url.format(result.job.remoteFont.urlObject);
        const replaceTo = path.join(result.job.font.destinationRelativePath, result.download.path)
            // Replace `\\` to `/` for Windows compatibility.
            .replace(/\\/g, '/');

        if (result.job.declaration.value) {
            result.job.declaration.value = result.job.declaration.value.replace(originalUri, replaceTo);
        }
    }

}
