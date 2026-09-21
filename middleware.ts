import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server'
import { randomId } from './packages/lesswrong/lib/random';
import { getMarkdownPathname } from './packages/lesswrong/lib/routeChecks/markdownVersionRoutes';
import { findStatusCodeInStream } from './packages/lesswrong/lib/postPageCache/responseMetadataStream';
import {
  STATUS_CODE_LOOPBACK_HEADER,
  buildCachedPostPath,
  getCacheablePostPagePath,
  normalizeAcceptEncoding,
} from './packages/lesswrong/lib/postPageCache/htmlCacheEligibility';
import { postPageCacheConfig } from './packages/lesswrong/lib/postPageCache/config';

// These need to be defined here instead of imported from @/lib/cookies/cookies
// because that import chain contains a transitive import of lodash, which
// causes the proxy build to fail (lodash contains some "Dynamic Code Evaluation"
// somewhere).
export const CLIENT_ID_COOKIE = 'clientId';
export const CLIENT_ID_NEW_COOKIE = 'clientIdUnset';

const ForwardingHeaderName = STATUS_CODE_LOOPBACK_HEADER;

function urlIsAbsolute(url: string): boolean {
  // Check if the URL starts with a protocol (http:, https:, ftp:, etc.)
  // or with double slashes (//) which indicates protocol-relative URL
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * Nextjs proxy. Because nextjs only allows a single proxy function,
 * this is three middlewares jammed into one: One for canonicalizing the
 * capitalization of route names, one for assigning a clientId cookie to clients
 * that don't have one, and one that handles http status codes and redirects.
 *
 * Handling of http status codes is a terrible hack where we look for the
 * <StatusCodeSetter> component, and delay forwarding the response to the client
 * until we've seen it. StatusCodeSetter is in <RouteRoot> unless you pass it
 * the delayedStatusCode prop, in which case you're responsible for ensuring
 * that <StatusCodeSetter> appears in the DOM (ideally after the smallest-
 * possible amount of loading).
 */
export async function middleware(request: NextRequest) {
  const clientIdCookie = request.cookies.get(CLIENT_ID_COOKIE);
  const addedClientId = clientIdCookie ? null : randomId();
  const requestPathHasMarkdownVersion = !!getMarkdownPathname(request.nextUrl.pathname);
  
  const isForwarded = request.headers.get(ForwardingHeaderName);
  if (isForwarded) {
    return NextResponse.next();
  }
  
  const markdownNegotiation = getMarkdownNegotiationMode(request);
  if (markdownNegotiation) {
    const markdownRewrite = getMarkdownRewriteResponse(request, addedClientId);
    if (markdownRewrite) {
      return markdownRewrite;
    }
    if (markdownNegotiation === "explicit") {
      const markdownUnavailableRewrite = getMarkdownUnavailableRewriteResponse(request, addedClientId);
      if (markdownUnavailableRewrite) {
        return markdownUnavailableRewrite;
      }
    }
  }

  if (postPageCacheConfig.htmlCacheEnabled) {
    const cachedPostResponse = getCachedPostRewriteResponse(request, addedClientId);
    if (cachedPostResponse) {
      return cachedPostResponse;
    }
  }

  if (shouldProxyForStatusCode(request)) {
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set(ForwardingHeaderName, "true");
    
    const forwardUrl = request.nextUrl.href;
    const fixedForwardedUrl = fixForwardUrl(forwardUrl);
    const forwardedFetchResponse = await fetch(
      fixedForwardedUrl,
      {
        headers: addedClientId ? addClientIdToRequestHeaders(forwardedHeaders, addedClientId) : forwardedHeaders,
        method: request.method,
        redirect: 'manual',
        referrer: request.referrer,
        mode: request.mode,
        body: request.body,
      }
    );
    
    const originalBody = forwardedFetchResponse.body;
    if (!originalBody) {
      if (requestPathHasMarkdownVersion) {
        const nextResponse = new NextResponse(null, { headers: forwardedFetchResponse.headers, status: forwardedFetchResponse.status });
        addVaryHeader(nextResponse, "accept");
        return nextResponse;
      }
      return forwardedFetchResponse;
    }
    const [statusCodeFinderStream, responseStream] = originalBody.tee();
    const statusFromStream = await findStatusCodeInStream(statusCodeFinderStream);
  
    if (statusFromStream?.redirectTarget) {
      const {status, redirectTarget} = statusFromStream;
      if (urlIsAbsolute(redirectTarget)) {
        return NextResponse.redirect(redirectTarget, status);
      } else {
        return NextResponse.redirect(new URL(redirectTarget, request.url), status);
      }
    } else {
      const status = statusFromStream ? statusFromStream.status : forwardedFetchResponse.status;
  
      const nextResponse = new NextResponse(responseStream, { headers: forwardedFetchResponse.headers, status });
      if (requestPathHasMarkdownVersion) {
        addVaryHeader(nextResponse, "accept");
      }
      if (addedClientId) {
        return addClientIdToResponseHeaders(nextResponse, addedClientId);
      }
      return nextResponse;
    }
  } else {
    if (addedClientId) {
      addClientIdToRequest(request, addedClientId);
    }
    const nextResponse = NextResponse.next();
    if (requestPathHasMarkdownVersion) {
      addVaryHeader(nextResponse, "accept");
    }
    if (addedClientId) {
      addClientIdToResponseHeaders(nextResponse, addedClientId);
    }
    return nextResponse;
  }
}

type MarkdownNegotiationMode = "explicit" | "default";

/**
 * Routes that should default to returning markdown when the client doesn't
 * send an Accept header (e.g. bare `curl` or programmatic fetches by AI
 * agents). A wildcard-only or HTML-preferring Accept header still gets HTML.
 */
const markdownDefaultPathnames = new Set(["/editPost"]);

interface ParsedAcceptRange {
  mediaType: string
  mediaSubtype: string
  q: number
  index: number
}

function parseAcceptHeader(acceptHeader: string): ParsedAcceptRange[] {
  return acceptHeader
    .split(",")
    .map((rawPart, index) => ({ rawPart: rawPart.trim(), index }))
    .filter(({ rawPart }) => rawPart.length > 0)
    .map(({ rawPart, index }) => {
      const [mediaTypePart, ...params] = rawPart.split(";").map((part) => part.trim());
      const [mediaType = "*", mediaSubtype = "*"] = mediaTypePart.toLowerCase().split("/");
      const qParam = params.find((part) => part.toLowerCase().startsWith("q="));
      const parsedQ = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      const q = Number.isFinite(parsedQ) ? Math.min(Math.max(parsedQ, 0), 1) : 1;
      return { mediaType, mediaSubtype, q, index };
    });
}

function acceptsMediaRange(range: ParsedAcceptRange, mediaType: string, mediaSubtype: string): boolean {
  const typeMatches = range.mediaType === "*" || range.mediaType === mediaType;
  const subtypeMatches = range.mediaSubtype === "*" || range.mediaSubtype === mediaSubtype;
  return typeMatches && subtypeMatches;
}

function getRangeSpecificity(range: ParsedAcceptRange): number {
  if (range.mediaType === "*" && range.mediaSubtype === "*") {
    return 0;
  }
  if (range.mediaSubtype === "*") {
    return 1;
  }
  return 2;
}

function getEffectiveQForMediaType(ranges: ParsedAcceptRange[], mediaTypeWithSubtype: string): number {
  const [mediaType, mediaSubtype] = mediaTypeWithSubtype.split("/");
  const matchingRanges = ranges.filter((range) => acceptsMediaRange(range, mediaType, mediaSubtype));
  if (matchingRanges.length === 0) {
    return 0;
  }
  matchingRanges.sort((a, b) => {
    const specificityDelta = getRangeSpecificity(b) - getRangeSpecificity(a);
    if (specificityDelta !== 0) {
      return specificityDelta;
    }
    return a.index - b.index;
  });
  return matchingRanges[0].q;
}

function getMarkdownNegotiationMode(request: NextRequest): MarkdownNegotiationMode | null {
  const formatOverride = request.nextUrl.searchParams.get("format")?.toLowerCase();
  if (formatOverride === "markdown" || formatOverride === "md") {
    return "explicit";
  }
  if (formatOverride === "html") {
    return null;
  }

  const acceptHeader = request.headers.get("accept")?.toLowerCase() ?? "";
  if (!acceptHeader.trim()) {
    if (markdownDefaultPathnames.has(request.nextUrl.pathname)) {
      return "default";
    }
    return null;
  }

  const parsedRanges = parseAcceptHeader(acceptHeader);
  const markdownPreference = Math.max(
    getEffectiveQForMediaType(parsedRanges, "text/markdown"),
    getEffectiveQForMediaType(parsedRanges, "text/plain")
  );
  const htmlPreference = Math.max(
    getEffectiveQForMediaType(parsedRanges, "text/html"),
    getEffectiveQForMediaType(parsedRanges, "application/xhtml+xml")
  );

  // For ambiguous or wildcard-only requests, default to HTML…
  if (markdownPreference > 0 && markdownPreference > htmlPreference) {
    return "explicit";
  }
  // …unless this is a markdown-default route and the client hasn't shown an
  // explicit preference for HTML (e.g. curl's default `*/*`).
  if (markdownDefaultPathnames.has(request.nextUrl.pathname) && htmlPreference <= markdownPreference) {
    return "default";
  }
  return null;
}

function getMarkdownRewriteResponse(request: NextRequest, addedClientId: string | null): NextResponse | null {
  const markdownPathname = getMarkdownPathname(request.nextUrl.pathname);
  if (!markdownPathname) {
    return null;
  }

  const rewrittenUrl = new URL(markdownPathname, request.url);
  rewrittenUrl.search = request.nextUrl.search;
  const response = NextResponse.rewrite(rewrittenUrl);
  addVaryHeader(response, "accept");
  if (addedClientId) {
    return addClientIdToResponseHeaders(response, addedClientId);
  }
  return response;
}

function getMarkdownUnavailableRewriteResponse(request: NextRequest, addedClientId: string | null): NextResponse {
  const unavailableUrl = new URL("/api/markdown-unavailable", request.url);
  const rewriteHeaders = new Headers(request.headers);
  rewriteHeaders.set("x-markdown-unavailable-from", request.nextUrl.pathname);
  const response = NextResponse.rewrite(unavailableUrl, {
    request: { headers: rewriteHeaders },
  });
  addVaryHeader(response, "accept");
  if (addedClientId) {
    return addClientIdToResponseHeaders(response, addedClientId);
  }
  return response;
}

function addVaryHeader(response: NextResponse, headerName: string) {
  const existingVary = response.headers.get("vary");
  if (!existingVary) {
    response.headers.set("vary", headerName);
    return;
  }
  const existingParts = existingVary
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (!existingParts.includes(headerName.toLowerCase())) {
    response.headers.set("vary", `${existingVary}, ${headerName}`);
  }
}

/**
 * Route eligible logged-out post page requests to the cached-post route
 * handler, whose responses Vercel's CDN caches, one entry per post. The query
 * string is not carried over. Returns null when the request must be rendered
 * dynamically.
 */
function getCachedPostRewriteResponse(request: NextRequest, addedClientId: string | null): NextResponse | null {
  const parsedPath = getCacheablePostPagePath({
    method: request.method,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    cookieNames: request.cookies.getAll().map((cookie) => cookie.name),
    getHeader: (name: string) => request.headers.get(name),
  });
  if (!parsedPath) {
    return null;
  }
  const targetUrl = new URL(buildCachedPostPath(parsedPath.postId, parsedPath.slug), request.url);

  // Collapse Accept-Encoding to the two representations the handler emits so
  // the CDN, which varies on it, holds at most two entries per page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('accept-encoding', normalizeAcceptEncoding(request.headers.get('accept-encoding')));

  const response = NextResponse.rewrite(targetUrl, { request: { headers: requestHeaders } });
  response.headers.set('x-lw-post-cache-routing', 'cached');
  if (addedClientId) {
    addClientIdToResponseHeaders(response, addedClientId);
  }
  return response;
}

function shouldProxyForStatusCode(req: NextRequest) {
  if (req.nextUrl.pathname === '/') {
    return false;
  }
  
  return true;
}

function addClientIdToRequestHeaders(headers: Headers, clientId: string): Headers {
  const cookies = headers.get("Cookie")?.split("; ") ?? [];
  const cookiesByName = {};
  for (const cookie of cookies) {
    const [k,v] = cookie.split("=");
    cookies[k] = cookie;
  }
  cookiesByName[CLIENT_ID_COOKIE] = clientId;
  cookiesByName[CLIENT_ID_NEW_COOKIE] = "true";
  const newCookies = Object.entries(cookiesByName).map(([k,v]) => `${k}=${v}`).join("; ");
  const newHeaders = new Headers(headers);
  newHeaders.set("Cookie", newCookies);
  return newHeaders;
}

function addClientIdToRequest(request: NextRequest, clientId: string) {
  request.cookies.set({ name: CLIENT_ID_COOKIE, value: clientId });
  request.cookies.set({ name: CLIENT_ID_NEW_COOKIE, value: "true" });
}

function addClientIdToResponseHeaders(nextResponse: NextResponse, clientId: string): NextResponse {
  // Cookie max-age is in seconds, not milliseconds
  const maxAge = 60 * 60 * 24 * 365;

  nextResponse.cookies.set({ name: CLIENT_ID_COOKIE, value: clientId, path: "/", maxAge });
  nextResponse.cookies.set({ name: CLIENT_ID_NEW_COOKIE, value: "true", path: "/", maxAge });

  return nextResponse;
}

// HACK: When requests are forwarded through ngrok (or cloudflare's tunnel), they
// get an X-Forwarded-Proto header of "https". This causes req.nextUrl to be
// "https://localhost:3000", which doesn't work (because it shouldn't be https).
// Work around this by dropping the "s".
function fixForwardUrl(forwardUrl: string): string {
  if (forwardUrl.startsWith("https://localhost")) {
    return forwardUrl.replace("https://localhost", "http://localhost");
  }
  return forwardUrl;
}

export const config: MiddlewareConfig = {
  matcher: [
    {
      source: "/",
      missing: [
        { type: 'header', key: 'next-router-state-tree' },
      ],
    },
    /*
     * Match all request paths except for the ones starting with:
     * - api (a subset of API routes)
     * - auth (auth routes)
     * - graphql, analyticsEvent, ckeditor-token, feed.xml (high-volume API routes)
     * - public, reactionImages (static files)
     * The rest of these were copied from their docs:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    {
      source: "/((?!api|$|auth|graphql|graphql2|hocuspocusWebhook|analyticsEvent|public|ckeditor-token|ckeditor-webhook|feed.xml|reactionImages|cached-post|_next/static|_next/image|favicon.ico|sitemap.xml|.well-known|oauth|logout|admin/debugHeaders|robots.txt).*)",
      missing: [
        { type: 'header', key: 'next-router-state-tree' },
      ],
    }
  ]
}
