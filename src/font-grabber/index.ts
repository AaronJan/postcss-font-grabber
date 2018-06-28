import EventEmitter from 'events';
import { Transformer as PostcssTransformer, Declaration as PostcssDeclaration } from 'postcss';
import { debuglog } from 'util';
import url from 'url';
import path from 'path';

import {
    PluginSettings,
    Meta,
    Job,
    JobResult,
    DoneCallback,
    PostcssChildNodeProcessor,
} from '../contracts';
import {
    parseOptions,
    processDeclaration,
    isRemoteFontFaceDeclaration,
    downloadFont,
} from './functions';
import { unique, md5 } from '../helpers';

const debug = debuglog('FontGrabber');

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
        this.settings = parseOptions(settings);
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

    makeTransformer(): PostcssTransformer {
        return (root, result) => {
            debug(`CSS file: [${root.source.input.file}]`);

            /**
             * Validate PostCSS options.
             */
            if (result === undefined || result.opts === undefined || result.opts.to === undefined) {
                throw new Error(`PostCSS-Font-Grabber requires PostCSS's \`to\` option.`);
            }
            const cssOutputTo = this.settings.cssDestinationDirectoryPath;
            const fontOutputTo = this.settings.directoryPath !== undefined ?
                this.settings.directoryPath :
                path.dirname(result.opts.to);

            debug(`output : [${root.source.input.file}]`);

            const jobs: Job[] = [];
            const declarationProcessor: PostcssChildNodeProcessor = node => {
                if (isRemoteFontFaceDeclaration(node)) {
                    jobs.push(...processDeclaration(<PostcssDeclaration>node, root.source.input.file, cssOutputTo, fontOutputTo));
                }
            };
            root.walkAtRules(/font-face/, rule => rule.each(declarationProcessor));

            const uniqueJobs = unique(jobs, job => md5(url.format(job.remoteFont.urlObject) + job.css.sourcePath));
            const downloadPromises = uniqueJobs.map(job => downloadFont(job, this.settings.autoCreateDirectory));

            return Promise.all(downloadPromises)
                .then(jobResults => {
                    this.done(jobResults);
                });
        };
    }

    onDone(callback: DoneCallback) {
        this.doneEmitter.on('done', callback);
    }

}
