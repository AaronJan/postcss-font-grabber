jest.mock('fs');
jest.mock('path');

import {
  getOrDefault,
  defaultValue,
  pick,
  trim,
  md5,
  unique,
  makeDirectoryRecursively,
} from './helpers';

describe('getOrDefault', () => {
  test('value is exist', () => {
    const subject = {
      name: 'john',
    };

    expect(getOrDefault(subject, 'name', 'jack')).toBe('john');
  });

  test('value is not exist', () => {
    const subject = {
      age: '24',
    };

    expect(getOrDefault(subject, 'name', 'jack')).toBe('jack');
  });
});

describe('defaultValue', () => {
  test('value is exist', () => {
    const value = 123;

    expect(defaultValue(value, 321)).toBe(123);
  });

  test('value is not exist', () => {
    const value = undefined;

    expect(defaultValue(value, 321)).toBe(321);
  });
});

describe('pick', () => {
  test('pick one that is exist', () => {
    const host = {
      name: 'john',
      age: 24,
      height: 185,
    };

    expect(pick(host, ['name'])).toEqual({
      name: 'john',
    });
  });

  test("pick one that isn't exist", () => {
    const host = {
      name: 'john',
      age: 24,
      height: 185,
    };

    expect(
      pick<any, any>(host, ['phone']),
    ).toMatchObject({});
  });
});

describe('trim', () => {
  test('trim space', () => {
    expect(trim('  abc      ')).toBe('abc');
  });

  test('trim tab', () => {
    expect(trim('\tabc\t\t\t')).toBe('abc');
  });

  test('trim newline', () => {
    expect(trim('\r\nabc\n\n')).toBe('abc');
  });
});

describe('md5', () => {
  test('equal', () => {
    expect(md5('ffdac')).toBe('42bf23f15aa2f8f65598716a9eb6de78');
  });
});

describe('unique', () => {
  test('works as expected', () => {
    const array = ['a1', 'a2', 'a3', 'b1', 'b2'];

    const expected = ['a1', 'b1'];

    expect(unique(array, value => value.replace(/[0-9]/g, ''))).toEqual(
      expected,
    );
  });
});

describe('makeDirectoryRecursively', () => {
  test('makes `public/fonts` directories', async () => {
    const fs = require('fs');
    const path = require('path');
    fs.stat = jest
      .fn()
      .mockImplementationOnce((filePath, callback) => {
        callback();
      })
      .mockImplementationOnce((filePath, callback) => {
        callback();
      })
      .mockImplementationOnce((filePath, callback) => {
        callback({ code: 'ENOENT' });
      })
      .mockImplementationOnce((filePath, callback) => {
        callback({ code: 'ENOENT' });
      });
    fs.mkdir = jest
      .fn()
      .mockImplementationOnce((directoryPath, callback) => callback())
      .mockImplementationOnce((directoryPath, callback) => callback());
    path.sep = '/';
    path.resolve = jest.fn().mockReturnValueOnce('/var/project/public/fonts');

    const directoryPath = '/var/project/public/fonts/';

    expect(await makeDirectoryRecursively(directoryPath)).toBeUndefined();

    expect(fs.stat).toHaveBeenCalledTimes(4);
    expect(fs.stat.mock.calls[0][0]).toBe('/var');
    expect(typeof fs.stat.mock.calls[0][1]).toBe('function');
    expect(fs.stat.mock.calls[1][0]).toBe('/var/project');
    expect(typeof fs.stat.mock.calls[1][1]).toBe('function');
    expect(fs.stat.mock.calls[2][0]).toBe('/var/project/public');
    expect(typeof fs.stat.mock.calls[2][1]).toBe('function');
    expect(fs.stat.mock.calls[3][0]).toBe('/var/project/public/fonts');
    expect(typeof fs.stat.mock.calls[3][1]).toBe('function');

    expect(fs.mkdir).toHaveBeenCalledTimes(2);
    expect(fs.mkdir.mock.calls[0][0]).toBe('/var/project/public');
    expect(typeof fs.mkdir.mock.calls[0][1]).toBe('function');
    expect(fs.mkdir.mock.calls[1][0]).toBe('/var/project/public/fonts');
    expect(typeof fs.mkdir.mock.calls[1][1]).toBe('function');
  });

  test('makes `public\\fonts` directories on Windows', async () => {
    const fs = require('fs');
    const path = require('path');
    fs.stat = jest
      .fn()
      .mockImplementationOnce((filePath, callback) => {
        callback();
      })
      .mockImplementationOnce((filePath, callback) => {
        callback({ code: 'ENOENT' });
      })
      .mockImplementationOnce((filePath, callback) => {
        callback({ code: 'ENOENT' });
      });
    fs.mkdir = jest
      .fn()
      .mockImplementationOnce((directoryPath, callback) => callback())
      .mockImplementationOnce((directoryPath, callback) => callback());
    path.sep = '\\';
    path.resolve = jest.fn().mockReturnValueOnce('D:\\project\\public\\fonts');

    const directoryPath = 'D:\\project\\public\\fonts\\';

    expect(await makeDirectoryRecursively(directoryPath)).toBeUndefined();

    expect(fs.stat).toHaveBeenCalledTimes(3);
    expect(fs.stat.mock.calls[0][0]).toBe('D:\\project');
    expect(typeof fs.stat.mock.calls[0][1]).toBe('function');
    expect(fs.stat.mock.calls[1][0]).toBe('D:\\project\\public');
    expect(typeof fs.stat.mock.calls[1][1]).toBe('function');
    expect(fs.stat.mock.calls[2][0]).toBe('D:\\project\\public\\fonts');
    expect(typeof fs.stat.mock.calls[2][1]).toBe('function');

    expect(fs.mkdir).toHaveBeenCalledTimes(2);
    expect(fs.mkdir.mock.calls[0][0]).toBe('D:\\project\\public');
    expect(typeof fs.mkdir.mock.calls[0][1]).toBe('function');
    expect(fs.mkdir.mock.calls[1][0]).toBe('D:\\project\\public\\fonts');
    expect(typeof fs.mkdir.mock.calls[1][1]).toBe('function');
  });
});
