/**
 * Request classification for the CDN cache of logged-out post pages.
 * Imported by middleware.ts, so this module must stay free of heavy or
 * node-only dependencies.
 */

export const CACHED_POST_ROUTE_PREFIX = '/cached-post';

/**
 * Request header marking a loopback render made by middleware.ts (for status
 * code discovery) or by the cached-post route handler. A request carrying it
 * bypasses the middleware's proxying and cache routing.
 */
export const STATUS_CODE_LOOPBACK_HEADER = 'X-Forwarded-For-Status-Codes';

/**
 * Cookies that may be present on a request that is still served the shared
 * cached page. `clientId`/`clientIdUnset` are minted by the middleware itself
 * on a visitor's first response; the `_vercel_*` cookies are set by Vercel's
 * deployment protection on preview deployments. Any other cookie means the
 * visitor has state (theme, timezone, login) that changes the rendered page.
 */
const HTML_CACHE_ALLOWED_COOKIES: ReadonlySet<string> = new Set([
  'clientId',
  'clientIdUnset',
  '_vercel_jwt',
  '_vercel_sso_nonce',
]);

const NEXT_NAVIGATION_HEADERS = ['rsc', 'next-router-prefetch', 'next-router-state-tree', 'next-router-segment-prefetch'];

export interface ParsedPostPagePath {
  postId: string
  slug: string | null
}

const POST_PAGE_PATH_REGEX = /^\/posts\/([A-Za-z0-9]{17})(?:\/([A-Za-z0-9_-]{1,300}))?\/?$/;

export function buildPublicPostPath(postId: string, slug: string | null): string {
  return slug ? `/posts/${postId}/${slug}` : `/posts/${postId}`;
}

export function buildCachedPostPath(postId: string, slug: string | null): string {
  const base = `${CACHED_POST_ROUTE_PREFIX}/${postId}`;
  return slug ? `${base}/${slug}` : base;
}

export interface PostPageRequestInput {
  method: string
  pathname: string
  search: string
  cookieNames: readonly string[]
  getHeader: (name: string) => string | null
}

/**
 * The post page a request may be served from the shared cache, or null when
 * it must be rendered dynamically: anything but a plain GET/HEAD document
 * request for `/posts/:id[/:slug]` with no query string, from a visitor
 * carrying no state-bearing cookies.
 */
export function getCacheablePostPagePath(request: PostPageRequestInput): ParsedPostPagePath | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const match = POST_PAGE_PATH_REGEX.exec(request.pathname);
  if (!match) return null;
  if (request.search && request.search !== '?') return null;
  if (request.getHeader(STATUS_CODE_LOOPBACK_HEADER) || request.getHeader('authorization') || request.getHeader('range')) return null;
  if (NEXT_NAVIGATION_HEADERS.some((header) => request.getHeader(header))) return null;
  if (request.cookieNames.some((cookieName) => !HTML_CACHE_ALLOWED_COOKIES.has(cookieName))) return null;
  return { postId: match[1], slug: match[2] ?? null };
}

export type NormalizedAcceptEncoding = 'gzip' | 'identity';

/**
 * Collapses the client's Accept-Encoding header to the two representations
 * the cached-post route handler produces, so that the CDN (which varies on
 * Accept-Encoding) holds at most two entries per page.
 */
export function normalizeAcceptEncoding(header: string | null): NormalizedAcceptEncoding {
  if (!header) return 'identity';
  let gzipQ: number | null = null;
  let wildcardQ: number | null = null;
  for (const rawPart of header.split(',')) {
    const [codingPart, ...params] = rawPart.trim().split(';');
    const coding = codingPart.trim().toLowerCase();
    if (!coding) continue;
    let q = 1;
    for (const param of params) {
      const [name, value] = param.trim().split('=');
      if (name?.trim().toLowerCase() === 'q') {
        const parsed = Number.parseFloat(value ?? '');
        q = Number.isFinite(parsed) ? parsed : 0;
      }
    }
    if (coding === 'gzip' || coding === 'x-gzip') gzipQ = q;
    else if (coding === '*') wildcardQ = q;
  }
  const effectiveQ = gzipQ ?? wildcardQ ?? 0;
  return effectiveQ > 0 ? 'gzip' : 'identity';
}
