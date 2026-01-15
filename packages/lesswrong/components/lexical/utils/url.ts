/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SUPPORTED_URL_PROTOCOLS = new Set([
  'http:',
  'https:',
  'mailto:',
  'sms:',
  'tel:',
]);

const EMAIL_REGEX = /[^@]+@[^.]+\.[^\n\r\f]+$/;
const HAS_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function tryToFixUrl(oldUrl: string, newUrl: string): string {
  try {
    new URL(newUrl);
    return newUrl;
  } catch {
    return oldUrl;
  }
}

// Normalize user-entered URLs by adding missing protocols or mailto:
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    if (EMAIL_REGEX.test(trimmed)) {
      return tryToFixUrl(trimmed, `mailto:${trimmed}`);
    }
    if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
      return trimmed;
    }
    if (!HAS_PROTOCOL_REGEX.test(trimmed)) {
      return tryToFixUrl(trimmed, `https://${trimmed}`);
    }
  }

  return trimmed;
}

export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // eslint-disable-next-line no-script-url
    if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      return 'about:blank';
    }
  } catch {
    return url;
  }
  return url;
}

// Source: https://stackoverflow.com/a/8234912/2013580
const urlRegExp = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/,
);
export function validateUrl(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where they user can type the URL before inserting it.
  return url === 'https://' || urlRegExp.test(url);
}
