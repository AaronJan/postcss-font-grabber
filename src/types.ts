import { Readable } from 'stream';
import * as url from 'url';

export interface PluginOptions {
  cssSrc?: string;
  cssDest?: string;
  fontDest?: string;
  downloader?: Downloader;
}

export interface ParsedSrc {
  urlObject: url.UrlWithStringQuery;
  format?: string;
}

export interface FontSpec {
  id: string;
  parsedSrc: ParsedSrc;
  basename: string;
  css: {
    sourceFile: string;
  };
}

export interface DownloadResult {
  data: Readable;
  mimeType?: string;
}

export interface Downloader {
  (specs: FontSpec): Promise<DownloadResult>;
}
