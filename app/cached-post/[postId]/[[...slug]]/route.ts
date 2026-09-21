import { NextRequest, NextResponse } from 'next/server';
import { FORUM_WIDE_CACHE_TAG, postCacheTag } from '@/lib/postPageCache/cacheTags';
import {
  STATUS_CODE_LOOPBACK_HEADER,
  buildPublicPostPath,
  normalizeAcceptEncoding,
} from '@/lib/postPageCache/htmlCacheEligibility';
import { findStatusCodeInStream } from '@/lib/postPageCache/responseMetadataStream';
import { postPageCacheConfig } from '@/lib/postPageCache/config';

/**
 * CDN-cacheable rendering of a post page for logged-out visitors, reached via
 * the rewrite in middleware.ts. The render is a loopback request with a fixed
 * header set, so nothing the visitor sent except the path and Accept-Encoding
 * can shape the shared page.
 */

const CDN_MAX_AGE_SECONDS = 3 * 24 * 60 * 60;
const CDN_STALE_WHILE_REVALIDATE_SECONDS = 3 * 24 * 60 * 60;
/** The status marker is rendered as soon as the post query resolves, well before the comments. */
const STATUS_MARKER_SCAN_LIMIT_BYTES = 4 * 1024 * 1024;

const POST_ID_REGEX = /^[A-Za-z0-9]{17}$/;
const SLUG_REGEX = /^[A-Za-z0-9_-]{1,300}$/;

interface CachedPostRouteParams {
  postId: string
  slug?: string[]
}

export async function GET(request: NextRequest, { params }: { params: Promise<CachedPostRouteParams> }) {
  const { postId, slug } = await params;
  if (!postPageCacheConfig.htmlCacheEnabled) {
    return new NextResponse('Not found', { status: 404 });
  }
  if (!POST_ID_REGEX.test(postId) || (slug && (slug.length !== 1 || !SLUG_REGEX.test(slug[0])))) {
    return new NextResponse('Bad request', { status: 400 });
  }
  const publicPath = buildPublicPostPath(postId, slug?.[0] ?? null);
  const startedAt = Date.now();

  const loopbackResponse = await fetch(getLoopbackUrl(request, publicPath), {
    method: 'GET',
    headers: getLoopbackHeaders(request),
    redirect: 'manual',
  });

  if (loopbackResponse.status >= 300 && loopbackResponse.status < 400) {
    const location = loopbackResponse.headers.get('location');
    return location
      ? NextResponse.redirect(new URL(location, request.url), loopbackResponse.status)
      : new NextResponse(null, { status: loopbackResponse.status });
  }
  if (!loopbackResponse.body) {
    return new NextResponse(null, { status: loopbackResponse.status });
  }

  const [scannerBranch, bodyBranch] = loopbackResponse.body.tee();
  const statusMetadata = await findStatusCodeInStream(scannerBranch, STATUS_MARKER_SCAN_LIMIT_BYTES);

  if (statusMetadata?.redirectTarget) {
    void bodyBranch.cancel().catch(() => {});
    return NextResponse.redirect(new URL(statusMetadata.redirectTarget, request.url), statusMetadata.status);
  }

  const status = statusMetadata?.status ?? loopbackResponse.status;
  // Without the marker the render didn't reach the point that determines the
  // status, so its output must not be stored.
  const cacheable = !!statusMetadata && (status === 200 || status === 404);
  const encoding = normalizeAcceptEncoding(request.headers.get('accept-encoding'));

  const headers = new Headers({
    'content-type': loopbackResponse.headers.get('content-type') ?? 'text/html; charset=utf-8',
    'vary': 'Accept-Encoding',
    'x-lw-post-cache': cacheable ? 'render' : 'uncached-render',
    'x-lw-post-cache-render-ms': String(Date.now() - startedAt),
  });
  if (cacheable) {
    // Browsers and other shared caches get no lifetime; only Vercel's CDN
    // stores the page, for as long as no mutation purges its tag.
    headers.set('cache-control', 'private, max-age=0, must-revalidate');
    headers.set('vercel-cdn-cache-control', `max-age=${CDN_MAX_AGE_SECONDS}, stale-while-revalidate=${CDN_STALE_WHILE_REVALIDATE_SECONDS}`);
    headers.set('vercel-cache-tag', `${postCacheTag(postId)},${FORUM_WIDE_CACHE_TAG}`);
  }

  let body: ReadableStream<Uint8Array> = bodyBranch;
  if (encoding === 'gzip') {
    // Compressing here (rather than at the edge) makes Vercel's response
    // size limit for cached entries apply to the compressed bytes.
    headers.set('content-encoding', 'gzip');
    body = bodyBranch.pipeThrough(new CompressionStream('gzip'));
  }

  return new NextResponse(body, { status, headers });
}

function getLoopbackUrl(request: NextRequest, publicPath: string): URL {
  const url = new URL(publicPath, request.nextUrl.origin);
  // Requests forwarded through ngrok or a Cloudflare tunnel arrive with an
  // https origin for localhost, which the local server doesn't serve.
  if (url.origin.startsWith('https://localhost')) {
    url.protocol = 'http:';
  }
  return url;
}

/**
 * Fixed request headers for the render, so that nothing the visitor sent
 * (cookies, user agent, language, client hints) can shape the shared page.
 */
function getLoopbackHeaders(request: NextRequest): Headers {
  const headers = new Headers({
    [STATUS_CODE_LOOPBACK_HEADER]: 'true',
    'accept': 'text/html',
    'accept-encoding': 'identity',
    'accept-language': 'en-US,en',
    'user-agent': 'LessWrongCachedPostRenderer/1.0',
  });
  // Preview deployments sit behind Vercel's deployment protection, which the
  // loopback must also pass. These credentials only authenticate the request
  // to Vercel; the app never sees them as visitor state.
  const protectionBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (protectionBypassSecret) {
    headers.set('x-vercel-protection-bypass', protectionBypassSecret);
  }
  const deploymentProtectionCookie = request.cookies.get('_vercel_jwt');
  if (deploymentProtectionCookie) {
    headers.set('cookie', `_vercel_jwt=${deploymentProtectionCookie.value}`);
  }
  return headers;
}
