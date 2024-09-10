import RNConfigReader from 'react-native-config-reader';
import unorm from 'unorm';

import { I18n } from '~/app/i18n';

/**
 * Check if string is empty (only contains spaces).
 * @param str
 */
export const isStringEmpty = (str: string) => str.trim().length === 0;

/**
 * Uppercase the first letter of a string.
 * @param str
 */
export const uppercaseFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Return a string that have no more accents.
 * @param str
 */
// from https://stackoverflow.com/a/37511463/6111343 but using unorm package instead of String.normalize (not available on Android Release mode)
export const removeAccents = (str: string) => {
  const combiningChars = /[\u0300-\u036F]/g;
  return unorm.nfd(str).replace(combiningChars, '') as string;
};

/**
 * Remove the first word of a string.
 * @param str
 */
export const removeFirstWord = (str: string) => {
  const indexOfSpace = str.indexOf(' ');
  if (indexOfSpace === -1) return '';
  return str.substring(indexOfSpace + 1);
};

/**
 * Get a search query (an array of normalized string) from a input text.
 * Spaces are trimmed as separated words.
 * ToDo: make a special treatments for quoted strings
 * @param str
 * @returns
 */
export const computeSearchQuery = (str: string) => {
  return removeAccents(str).toLocaleLowerCase().split(/\s+/);
};

export const computeSearchValue = (str: string) => {
  return removeAccents(str).toLocaleLowerCase();
};

/**
 * Returns a converted string from camelCase (or UppercasedCamelCase) to snake_case.
 * @param camelCase
 */
export function toSnakeCase(camelCase: string) {
  const upperChars = camelCase.match(/([A-Z])/g);
  if (!upperChars) {
    return camelCase;
  }

  let str = camelCase;
  for (let i = 0, n = upperChars.length; i < n; i++) {
    str = str.replace(new RegExp(upperChars[i]), '_' + upperChars[i].toLowerCase());
  }

  if (str.slice(0, 1) === '_') {
    str = str.slice(1);
  }

  return str;
}

export function toCamelCase(kebabCase: string, uppercased?: boolean): string {
  return kebabCase
    .split(/[-_]/)
    .reduce((acc, word, index) => acc + (index !== 0 || uppercased ? uppercaseFirstLetter(word) : word), '');
}

// From https://dev.to/cod3pineapple/1143-longest-common-subsequence-javascript-solution-5bgp
export const findLongestCommonSubstring = function (a: string, b: string) {
  let longest = '';
  // loop through the first string
  for (let i = 0; i < a.length; ++i) {
    // loop through the second string
    for (let j = 0; j < b.length; ++j) {
      // if it's the same letter
      if (a[i] === b[j]) {
        let str = a[i];
        let k = 1;
        // keep going until the letters no longer match, or we reach end
        while (
          i + k < a.length &&
          j + k < b.length && // haven't reached end
          a[i + k] === b[j + k]
        ) {
          // same letter
          str += a[i + k];
          ++k;
        }
        // if this substring is longer than the longest, save it as the longest
        if (str.length > longest.length) {
          longest = str;
        }
      }
    }
  }
  return longest;
};

/**
 * Split a string in a given number of lines. Tries to generate homogenous line lengths.
 * @param input the input string is not modified.
 * @param nbLines number of lines of the output (>= 1)
 * @param separator a string or a regex that represent a word separator. MUST HAVE CAPTURING PARENTHESIS if regex given. (\s+ by default)
 * @param newLine character or string to insert at every line. (\n by default)
 * @param minLength minimal length of a line
 * @returns The new string
 */
export function splitWords(
  input: string,
  nbLines: number,
  separator: string | RegExp = /(\s+)/g,
  newLine: string = '\n',
  minLength: number = 2,
) {
  if (nbLines <= 0) throw new Error(`splitWords lines cannot be zero or negatives`);
  let regex = typeof separator === 'string' ? new RegExp(separator.replace(/([-/\\^$*+?.()|[\]{}])/g, '\\$&')) : separator;
  if (!regex.global) {
    regex = new RegExp(regex, 'g');
  }
  const lineSize = input.length / nbLines;
  const words = input.split(regex);
  let output = '';
  let curLine = 0;
  let nbReturns = 0;
  words.forEach(word => {
    if (curLine + word.length > lineSize && curLine > minLength) {
      if (nbReturns < nbLines) output += newLine;
      ++nbReturns;
      curLine = 0;
    }
    output += word;
    curLine += word.length;
  });
  return output;
}

/**
 * Removes every illegal characters in Unix filesystem.
 * @param name input string is not modified
 * @returns The new string
 */
export function getSafeFileName(input?: string) {
  return input?.replaceAll(/[\\0/]/g, '-');
}

/**
 * Create a unique UUID identifier.
 * @returns The new UUID
 */
// from https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
export function createUUID() {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    // The bitwise AND (&) operator is wanted here
    // eslint-disable-next-line no-bitwise
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    // The bitwise OR (|) operator is wanted here
    // eslint-disable-next-line no-bitwise
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

/**
 * Get name of current override.
 * @returns The override name
 */
export function getOverrideName() {
  return (RNConfigReader.BundleVersionOverride as string).split('/')[0];
}

/**
 * Get string for comments count.
 * @returns The new string
 */
export const commentsString = (comments: number) =>
  comments
    ? comments === 1
      ? `1 ${I18n.get('blog-postlist-comment').toLowerCase()}`
      : `${comments} ${I18n.get('blog-postlist-comments').toLowerCase()}`
    : I18n.get('blog-postlist-comment-nocomments');
