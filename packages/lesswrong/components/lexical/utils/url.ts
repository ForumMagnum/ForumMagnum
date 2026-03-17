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
  return url === 'https://' || urlRegExp.test(url) || /^[/?#]/.test(url);
}

const LOCALHOST_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
];

function isLocalhostUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  return LOCALHOST_PATTERNS.some(pattern => hostname === pattern || hostname.endsWith('.' + pattern));
}

/**
 * Validates that a URL is appropriate for an embedded image.
 * This is stricter than validateUrl because:
 * - Only http/https URLs are allowed (no relative paths, mailto, etc.)
 * - Localhost URLs are blocked (they won't work for other users)
 * - The URL must be well-formed
 *
 * Returns an error message if invalid, or null if valid.
 */
export function validateImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return 'URL is required';
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Invalid URL format';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'URL must use http or https';
  }

  if (isLocalhostUrl(parsed)) {
    return 'Localhost URLs are not allowed';
  }

  // Check for obviously invalid hostnames (no TLD)
  const hostname = parsed.hostname;
  if (!hostname.includes('.') && hostname !== 'localhost') {
    return 'Invalid hostname';
  }

  return null;
}
