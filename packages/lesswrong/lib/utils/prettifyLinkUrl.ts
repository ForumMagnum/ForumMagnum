import { getUrlClass } from '@/server/utils/getUrlClass';
import { looksLikeDbIdString } from '@/lib/routeUtil';
import { normalizeDisplayHost } from './urlHosts';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hexRegex = /^[0-9a-f]+$/i;
const hasLetterRegex = /[a-z]/i;
const hasDigitRegex = /[0-9]/;

const minIdishLength = 12;

/** Must never match a readable slug, only opaque ids. */
function isIdishSegment(segment: string): boolean {
  // The ids in our own URLs, which are the common case here.
  if (looksLikeDbIdString(segment)) {
    return true;
  }
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

  const URLClass = getUrlClass();
  let parsed;
  try {
    parsed = new URLClass(toParse);
  } catch {
    return trimmed;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return trimmed;
  }

  const host = normalizeDisplayHost(parsed.host);
  const path = collapseIdishSegments(parsed.pathname).replace(/\/$/, '');

  return `${host}${path}`;
}
