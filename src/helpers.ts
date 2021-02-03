import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';

export type Dictionary<T> = {
  [property: string]: T;
};

export function getOrDefault<T>(
  object: Dictionary<T>,
  key: string,
  defaultValue: T,
): T {
  if (object[key] === undefined) {
    return defaultValue;
  }

  return object[key];
}

export function defaultValue<T>(value: T | undefined, defaultValue: T): T {
  if (value === undefined) {
    return defaultValue;
  }

  return value;
}

export function pick<T, K extends keyof T>(
  object: T,
  keys: ReadonlyArray<K>,
): Pick<T, K> {
  return <Pick<T, K>>keys.reduce((result, key) => {
    return Object.assign(result, { [key]: object[key] });
  }, {});
}

/**
 *
 * @param {string} text
 * @returns {string}
 */
export function trim(text: string): string {
  return text.replace(/(^\s+|\s+$)/g, '');
}

export function md5(original: string): string {
  return createHash('md5').update(original).digest().toString('hex');
}

export function unique<T>(array: T[], identify?: (value: T) => string): T[] {
  if (identify === undefined) {
    return array.filter((value, index) => array.indexOf(value) === index);
  }

  const ids: string[] = [];
  return array.reduce<T[]>((result, value) => {
    const id = identify(value);

    if (ids.indexOf(id) === -1) {
      ids.push(id);

      return [...result, value];
    }

    return result;
  }, []);
}

export function makeDirectoryRecursively(directoryPath: string): Promise<void> {
  return new Promise((resolve, reject) =>
    fs.mkdir(path.normalize(directoryPath), { recursive: true }, error => {
      if (error) {
        return reject(error);
      }
      resolve();
    }),
  );
}
