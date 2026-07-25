import { getUrlClass } from '@/server/utils/getUrlClass';

const URLClass = getUrlClass();

/** Kept short deliberately: `blog.`, `docs.` etc carry meaning. */
const noiseSubdomains = ['www.', 'www2.', 'm.', 'mobile.'];

/** eg `en.m.wikipedia.org`, `de.m.wikipedia.org` */
const localeMobileSubdomainRegex = /^[a-z]{2}\.m\./i;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hexRegex = /^[0-9a-f]+$/i;
const hasLetterRegex = /[a-z]/i;
const hasDigitRegex = /[0-9]/;

const minIdishLength = 12;

/** Guards hosts that just start with the prefix, eg `mobile.com`. */
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
    // 5 = two-letter language code plus the `m.`
    return stripPrefixIfDomainRemains(host, 5) ?? host;
  }
  return host;
}

/** Must never match a readable slug, only opaque ids. */
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
 * A one-line label for the bottom of a hover-preview card, eg
 *   https://www.lesswrong.com/posts/tjeoLz2GzfFMysZhg/lightcone-commons
 * becomes
 *   lesswrong.com/posts/.../lightcone-commons
 *
 * Anything that isn't an http(s) URL comes back trimmed, unchanged.
 */
export function prettifyLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  // Scheme-less input needs one to parse; it is stripped again below.
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
