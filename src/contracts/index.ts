import postcss from 'postcss';
import * as url from 'url';

export interface PluginOptions {
    cssSrc?: string,
    cssDest?: string,
    fontDir?: string,
    mkdir?: boolean,
};

export interface PluginSettings {
    cssSourceDirectoryPath: string | undefined,
    cssDestinationDirectoryPath: string | undefined,
    fontDirectoryPath: string | undefined,
    autoCreateDirectory: boolean,
};

export interface RemoteFont {
    urlObject: url.UrlWithStringQuery,
    format: string,
}

export interface Job {
    declaration: postcss.Declaration,
    remoteFont: RemoteFont,
    css: {
        sourcePath: string,
        destinationDirectoryPath: string,
    },
    font: {
        destinationDirectoryPath: string,
        destinationRelativePath: string,
    },
}

export interface JobResult {
    job: Job,
    download: {
        path: string,
        fileName: string,
        size: number,
    },
}

export interface Meta {
    jobResults: JobResult[],
}

export type DoneCallback = (meta: Meta) => void;

export type PostcssChildNodeProcessor = (node: postcss.ChildNode, index: number) => any;

export type Dictionary<U> = { [key: string]: U };
