import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createHash } from 'crypto';

/**
 * 
 */
export type Dictionary<T> = {
    [property: string]: T,
};

/**
 * 
 * @param object 
 * @param key 
 * @param defaultValue 
 */
export function getOrDefault<T>(object: Dictionary<T>, key: string, defaultValue: T): T {
    if (object[key] === undefined) {
        return defaultValue;
    }

    return object[key];
}

/**
 * 
 * @param value 
 * @param defaultValue 
 */
export function defaultValue<T>(value: T | undefined, defaultValue: T): T {
    if (value === undefined) {
        return defaultValue;
    }

    return value;
}

/**
 * 
 * @param object 
 * @param keys 
 */
export function pick<T, K extends keyof T>(object: T, keys: ReadonlyArray<K>): Pick<T, K> {
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

/**
 * 
 * @param original 
 */
export function md5(original: string): string {
    return createHash('md5')
        .update(original)
        .digest()
        .toString('hex');
}

/**
 * 
 * @param array 
 * @param identify 
 */
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

/**
 * 
 * @param directoryPath 
 */
export async function makeDirectoryRecursively(directoryPath: string): Promise<void> {
    const fsStat = promisify(fs.stat);
    const fsMkdir = promisify(fs.mkdir);

    await path.resolve(directoryPath)
        .split(path.sep)
        .filter(directory => directory !== '')
        .reduce<Promise<string>>(async (result, current) => {
            const resultString = await result;
            const currentPath = path.normalize(`${resultString}${path.sep}${current}`);

            try {
                await fsStat(currentPath);
            } catch (e) {
                if (e.code === 'ENOENT') {
                    await fsMkdir(currentPath);
                } else {
                    throw e;
                }
            }
            return currentPath;
        }, Promise.resolve(''));
}

