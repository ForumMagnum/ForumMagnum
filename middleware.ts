import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server'
import { canonicalizePath } from "./packages/lesswrong/lib/generated/routeManifest";
import { randomId } from './packages/lesswrong/lib/random';

// These need to be defined here instead of imported from @/lib/cookies/cookies
// because that import chain contains a transitive import of lodash, which
// causes the middleware build to fail (lodash contains some "Dynamic Code Evaluation"
// somewhere).
export const CLIENT_ID_COOKIE = 'clientId';
export const CLIENT_ID_NEW_COOKIE = 'clientIdUnset';

const ForwardingHeaderName = "X-Forwarded-For-Status-Codes";

function urlIsAbsolute(url: string): boolean {
  return (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Nextjs middleware. Because nextjs only allows a single middleware function,
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
  // Before NextJS, we were using react-router, which wasn't case-sensitive by default.
  // To solve the problem of any existing links going to non-canonically-capitalized paths,
  // we have a codegen step that generates a trie which we use to find a matching canonical
  // path (if one exists).
  const currentPath = request.nextUrl.pathname;
  const canonical = canonicalizePath(currentPath);
  if (canonical && canonical !== currentPath) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }
  
  const clientIdCookie = request.cookies.get(CLIENT_ID_COOKIE);
  const addedClientId = clientIdCookie ? null : randomId();
  
  const isForwarded = request.headers.get(ForwardingHeaderName);
  if (isForwarded) {
    return NextResponse.next();
  }
  
  if (shouldProxyForStatusCode(request)) {
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set(ForwardingHeaderName, "true");
    
    const forwardedFetchResponse = await fetch(
      request.nextUrl,
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
    if (addedClientId) {
      addClientIdToResponseHeaders(nextResponse, addedClientId);
    }
    return nextResponse;
  }
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

type StatusCodeMetadata = { status: number, redirectTarget?: string };

const searchString: Uint8Array = new TextEncoder().encode('<div data-response-metadata="');
const doubleQuoteAscii = '\"'.charCodeAt(0);

/**
 * Look for a substring that looks like
 *   <div data-response-metadata="eyJzdGF0dXMiOjQwNH0=">
 * in a ReadableStream, parse the attribute, and return it as a StatusCodeMetadata.
 * The stream is UTF-8 encoded, and the thing we're looking for is a base64-encoded
 * string representing a serialized object, which may span chunk boundaries.
 */
async function findStatusCodeInStream(stream: ReadableStream<Uint8Array<ArrayBufferLike>>): Promise<StatusCodeMetadata|null> {
  let matchIndex = 0;
  let isReadingResult = false;
  let result: number[] = [];

  const reader = stream.getReader();
  loop: {
    for (;;) {
      const readResult = await reader.read();
      if (!readResult.value || readResult.done) {
        break;
      }
      const chunk = readResult.value;
      for (let i=0; i<chunk.length; i++) {
        if (isReadingResult) {
          const nextCh = chunk.at(i)!;
          if (nextCh === doubleQuoteAscii) {
            break loop;
          } else {
            result.push(nextCh);
          }
        } else if (chunk.at(i) === searchString.at(matchIndex)) {
          matchIndex++;
          if (matchIndex >= searchString.length) {
            isReadingResult = true;
          }
        } else {
          matchIndex = 0;
        }
      }
    }
  }
  
  if (isReadingResult) {
    const base64EncodedStr = new TextDecoder().decode(new Uint8Array(result));
    const binaryString = atob(base64EncodedStr);
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    const decodedStr = new TextDecoder().decode(bytes);
    const parsed: { status: number, redirectTarget?: string } = JSON.parse(decodedStr);
    return parsed;
  } else {
    return null;
  }
}

export const config: MiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (a subset of API routes)
     * - auth (auth routes)
     * - graphql, analyticsEvent, ckeditor-token (high-volume API routes)
     * - public, reactionImages (static files)
     * The rest of these were copied from their docs:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    {
      source: '/((?!api|auth|graphql|analyticsEvent|public|ckeditor-token|reactionImages|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
      missing: [{ type: 'header', key: 'next-router-state-tree' }]
    }
  ]
}
