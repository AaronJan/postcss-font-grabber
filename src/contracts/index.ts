import postcss from 'postcss';
import * as url from 'url';

export interface PluginOptions {
    cssDestinationDirectoryPath: string,
    directoryPath?: string,
    autoCreateDirectory?: boolean,
};

export interface PluginSettings {
    cssDestinationDirectoryPath: string,
    directoryPath: string,
    autoCreateDirectory: boolean,
};

export interface RemoteFont {
    urlObject: url.UrlWithStringQuery,
    format: string,
}

export interface Job {
    remoteFont: RemoteFont,
    css: {
        sourcePath: string,
        targetDirectoryPath: string,
    },
    font: {
        path: string,
        filename: string,
    },
}

export interface JobResult {
    job: Job,
    download: {
        size: number,
    },
}

export interface Meta {
    jobResults: JobResult[],
}

export type DoneCallback = (meta: Meta) => void;

export type PostcssChildNodeProcessor = (node: postcss.ChildNode, index: number) => any;

export type Dictionary<U> = { [key: string]: U };
