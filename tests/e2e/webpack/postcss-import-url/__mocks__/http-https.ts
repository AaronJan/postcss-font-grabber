import { Readable } from 'stream';

let responseBody = Readable.from([
  String.raw`
@font-face {
  font-family: 'Fake Font';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url(https://example.com/fake-font.woff2) format('woff2');
}
`,
]);

export const get = jest.fn(
  (requestOptions: any, callback: (response: any) => void) => {
    return {
      on: jest.fn(() => {}),
      end: jest.fn(() => {
        callback(responseBody);
      }),
    };
  },
);
