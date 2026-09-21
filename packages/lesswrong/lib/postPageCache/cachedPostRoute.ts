import type { NextRequest } from 'next/server';
import type { ParamMap } from '../../../../.next/types/routes';
import { matchPath } from '../vendor/react-router/matchPath';
import { routePatternToReactRouterPath } from '../routeChecks/routePatternFormat';
import { STATUS_CODE_LOOPBACK_HEADER } from '../routeChecks/statusCodeLoopback';

// Imported by middleware.ts; keep free of heavy or node-only dependencies.

// Path prefix of the route handler (app/cache/posts) that eligible /posts
// requests are rewritten to.
const CACHED_POST_ROUTE_PREFIX = '/cache/posts';

// `clientId`/`clientIdUnset` are minted by the middleware itself on a visitor's
// first response, and the `_vercel_*` cookies are set by deployment protection
// on preview deployments. Any other cookie (theme, timezone, login) changes the
// rendered page.
const HTML_CACHE_ALLOWED_COOKIES: ReadonlySet<string> = new Set([
  'clientId',
  'clientIdUnset',
  '_vercel_jwt',
  '_vercel_sso_nonce',
]);

interface ParsedPostPagePath {
  postId: string
  slug: string | null
}

export function buildCachedPostPath(postId: string, slug: string | null): string {
  const base = `${CACHED_POST_ROUTE_PREFIX}/${postId}`;
  return slug ? `${base}/${slug}` : base;
}

export function buildPublicPostPath(postId: string, slug: string | null): string {
  return slug ? `/posts/${postId}/${slug}` : `/posts/${postId}`;
}

function routeMatchOptions(route: keyof ParamMap) {
  return { path: routePatternToReactRouterPath(route), exact: true, strict: false, sensitive: true };
}

function matchPostPagePath(pathname: string): ParsedPostPagePath | null {
  // A distinct route whose static segment would otherwise match as a post ID.
  if (matchPath(pathname, routeMatchOptions('/posts/slug/[slug]'))) return null;
  const withSlug = matchPath<ParamMap['/posts/[_id]/[slug]']>(pathname, routeMatchOptions('/posts/[_id]/[slug]'));
  if (withSlug) return { postId: withSlug.params._id, slug: withSlug.params.slug };
  const withoutSlug = matchPath<ParamMap['/posts/[_id]']>(pathname, routeMatchOptions('/posts/[_id]'));
  if (withoutSlug) return { postId: withoutSlug.params._id, slug: null };
  return null;
}

// The post page path of a request that the cached post route handler can
// serve: a logged-out, cookieless GET of /posts/:id[/:slug] with no query
// string. Anything else changes the render and is served by the regular route.
export function getCacheablePostPagePath(request: NextRequest): ParsedPostPagePath | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const parsedPath = matchPostPagePath(request.nextUrl.pathname);
  if (!parsedPath) return null;
  // This also excludes client-side navigations and prefetches, which need RSC
  // payloads: Next puts `_rsc` in their query string (and redirects to add it
  // if missing). Their `RSC` header can't be checked here, since Next strips
  // the flight headers before running the middleware.
  if (request.nextUrl.search) return null;
  if (request.headers.get(STATUS_CODE_LOOPBACK_HEADER)) return null;
  if (request.cookies.getAll().some((cookie) => !HTML_CACHE_ALLOWED_COOKIES.has(cookie.name))) return null;
  return parsedPath;
}

type NormalizedAcceptEncoding = 'gzip' | 'identity';

// The CDN varies on Accept-Encoding; collapsing it to the two encodings the
// cached post route handler emits keeps it to two entries per page.
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
