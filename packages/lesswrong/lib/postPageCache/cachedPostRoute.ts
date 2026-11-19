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

export function isSlackLinkExpander(userAgent: string | null): boolean {
  return !!userAgent?.startsWith("Slackbot-LinkExpanding");
}

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
// string, not from Slack's link expander (which gets a larger preview card).
// Anything else changes the render and is served by the regular route.
export function getCacheablePostPagePath(request: NextRequest): ParsedPostPagePath | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const parsedPath = matchPostPagePath(request.nextUrl.pathname);
  if (!parsedPath) return null;
  // Client-side navigations and prefetches, which need RSC payloads, never get
  // here: the middleware matcher excludes them. (They can't be detected here,
  // since Next strips both their `_rsc` param and their flight headers before
  // running the middleware.)
  if (request.nextUrl.search) return null;
  if (request.headers.get(STATUS_CODE_LOOPBACK_HEADER)) return null;
  if (isSlackLinkExpander(request.headers.get('user-agent'))) return null;
  if (request.cookies.getAll().some((cookie) => !HTML_CACHE_ALLOWED_COOKIES.has(cookie.name))) return null;
  return parsedPath;
}
