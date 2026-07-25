import { getUrlClass } from '@/server/utils/getUrlClass';

const URLClass = getUrlClass();

/**
 * Subdomain prefixes that carry no meaning for a human reading a link label.
 * Deliberately conservative: `blog.`, `docs.`, `mail.` etc are meaningful and
 * are left alone.
 */
const noiseSubdomains = ['www.', 'www2.', 'm.', 'mobile.'];

/** eg `en.m.wikipedia.org`, `de.m.wikipedia.org` */
const localeMobileSubdomainRegex = /^[a-z]{2}\.m\./i;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hexRegex = /^[0-9a-f]+$/i;
const hasLetterRegex = /[a-z]/i;
const hasDigitRegex = /[0-9]/;

const minIdishLength = 12;

/**
 * Only strip a prefix if what's left is still a domain (ie still has a dot), so
 * that a host which merely starts with those letters, like `mobile.com`, is
 * left alone.
 */
function stripPrefixIfDomainRemains(host: string, prefixLength: number): string|null {
  const remainder = host.slice(prefixLength);
  return remainder.includes('.') ? remainder : null;
}

function stripNoiseSubdomains(host: string): string {
  const lowercased = host.toLowerCase();
  for (const prefix of noiseSubdomains) {
    if (lowercased.startsWith(prefix)) {
      return stripPrefixIfDomainRemains(host, prefix.length) ?? host;
    }
  }
  if (localeMobileSubdomainRegex.test(lowercased)) {
    // Strip the `xx.m.` prefix, ie the two-letter language code plus the `m.`
    return stripPrefixIfDomainRemains(host, 5) ?? host;
  }
  return host;
}

/**
 * Whether a path segment looks like an opaque id rather than something a human
 * wrote. Readable slugs (which contain `-` or `_` separators, or are plain
 * words) must never match.
 */
function isIdishSegment(segment: string): boolean {
  if (segment.length < minIdishLength) {
    return false;
  }
  if (uuidRegex.test(segment)) {
    return true;
  }
  if (segment.includes('-') || segment.includes('_')) {
    return false;
  }
  if (hexRegex.test(segment)) {
    return true;
  }
  return hasLetterRegex.test(segment) && hasDigitRegex.test(segment);
}

function collapseIdishSegments(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (isIdishSegment(segment) ? '...' : segment))
    .join('/');
}

/**
 * Turn a raw href into a short, human-readable one-line label, of the sort
 * that's shown at the bottom of a hover-preview card. Drops the protocol, noise
 * subdomains, the query string and the hash, and collapses opaque id path
 * segments into `...`, eg
 *   https://www.lesswrong.com/posts/tjeoLz2GzfFMysZhg/lightcone-commons
 * becomes
 *   lesswrong.com/posts/.../lightcone-commons
 *
 * Anything that isn't an http(s) URL (a `mailto:` link, a malformed href) is
 * returned trimmed but otherwise unchanged.
 */
export function prettifyLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  // Protocol-relative and scheme-less inputs get a scheme so they parse; the
  // scheme is stripped again below either way.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const toParse = hasScheme
    ? trimmed
    : `https:${trimmed.startsWith('//') ? '' : '//'}${trimmed}`;

  let parsed;
  try {
    parsed = new URLClass(toParse);
  } catch {
    return trimmed;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return trimmed;
  }

  const host = stripNoiseSubdomains(parsed.host);
  const path = collapseIdishSegments(parsed.pathname).replace(/\/$/, '');

  return `${host}${path}`;
}
