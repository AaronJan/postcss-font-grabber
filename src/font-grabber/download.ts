import http from 'http';
import https from 'https';
import { Readable } from 'stream';
import { DownloadResult, FontSpec } from 'types';
import url from 'url';

export async function getStream(
  sourceUrl: string,
): Promise<{
  response: Readable;
  mimeType?: string;
}> {
  const urlObject = new url.URL(sourceUrl);
  const get = urlObject.protocol === 'http:' ? http.get : https.get;

  return new Promise((resolve, reject) => {
    get(urlObject.href, response => {
      if (response.statusCode !== 200) {
        return reject(
          new Error(
            `URL "${urlObject.href}" responded with status ${response.statusCode} instead with 200.`,
          ),
        );
      }

      const contentType = (response.headers['content-type'] ?? '').trim();
      resolve({
        response,
        mimeType: contentType !== '' ? contentType : undefined,
      });
    }).on('error', error => reject(error));
  });
}

export async function downloadFontFile(
  fontSpec: FontSpec,
): Promise<DownloadResult> {
  const { response, mimeType } = await getStream(
    fontSpec.parsedSrc.urlObject.href,
  );
  return {
    data: response,
    mimeType,
  };
}
