import { NextRequest, NextResponse } from 'next/server';
import { FORUM_WIDE_CACHE_TAG, postCacheTag, postPageCacheConfig } from '@/lib/postPageCache/config';
import { buildPublicPostPath, normalizeAcceptEncoding } from '@/lib/postPageCache/cachedPostRoute';
import { STATUS_CODE_LOOPBACK_HEADER, findStatusCodeInStream, fixLoopbackUrl } from '@/lib/routeChecks/statusCodeLoopback';

// Renders a post page for logged-out visitors in a form that Vercel's CDN
// caches, one entry per post, through a loopback to the regular /posts route.
// Eligible /posts requests reach it via the rewrite in middleware.ts; it can
// also be requested directly at /cache/posts/:id[/:slug] for testing.

const CDN_MAX_AGE_SECONDS = 2 * 60 * 60;
const CDN_STALE_WHILE_REVALIDATE_SECONDS = 2 * 60 * 60;
// The status marker is rendered as soon as the post query resolves, well
// before the comments.
const STATUS_MARKER_SCAN_LIMIT_BYTES = 4 * 1024 * 1024;

interface CachedPostRouteParams {
  postId: string
  slug?: string[]
}

export async function GET(request: NextRequest, { params }: { params: Promise<CachedPostRouteParams> }) {
  if (!postPageCacheConfig.htmlCacheEnabled) {
    return new NextResponse('Not found', { status: 404 });
  }
  const { postId, slug } = await params;
  if (slug && slug.length > 1) {
    return new NextResponse('Not found', { status: 404 });
  }
  const publicPath = buildPublicPostPath(encodeURIComponent(postId), slug ? encodeURIComponent(slug[0]) : null);
  // Query parameters (comment permalinks, revisions, sharing keys, ...) change
  // the render, so the middleware never rewrites such requests here; direct
  // requests carrying them are sent to the regular route.
  if (request.nextUrl.search) {
    return NextResponse.redirect(new URL(`${publicPath}${request.nextUrl.search}`, request.url));
  }
  const startedAt = Date.now();

  const loopbackResponse = await fetch(fixLoopbackUrl(new URL(publicPath, request.nextUrl.origin).href), {
    method: 'GET',
    headers: getLoopbackHeaders(),
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
  const outcome = cacheable ? 'render' : 'uncached-render';
  const renderMs = Date.now() - startedAt;
  // Structured line for the log drain: Vercel parses JSON console output, and
  // the Better Stack source extracts these fields for the post page cache
  // dashboard. Response headers don't reach the drain.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ lwPostPageCache: outcome, status, renderMs }));

  const headers = new Headers({
    'content-type': loopbackResponse.headers.get('content-type') ?? 'text/html; charset=utf-8',
    'vary': 'Accept-Encoding',
    'x-lw-post-cache': outcome,
    'x-lw-post-cache-render-ms': String(renderMs),
  });
  if (cacheable) {
    // Only Vercel's CDN stores the page; browsers and other shared caches get
    // no lifetime.
    headers.set('cache-control', 'private, max-age=0, must-revalidate');
    headers.set('vercel-cdn-cache-control', `max-age=${CDN_MAX_AGE_SECONDS}, stale-while-revalidate=${CDN_STALE_WHILE_REVALIDATE_SECONDS}`);
    headers.set('vercel-cache-tag', `${postCacheTag(postId)},${FORUM_WIDE_CACHE_TAG}`);
  }

  let body: ReadableStream<Uint8Array> = bodyBranch;
  if (encoding === 'gzip') {
    // Vercel's size limit for cached responses applies to the bytes the
    // function emits, so compressing here rather than at the edge makes it
    // apply to the compressed size.
    headers.set('content-encoding', 'gzip');
    body = bodyBranch.pipeThrough(new CompressionStream('gzip'));
  }

  return new NextResponse(body, { status, headers });
}

// A fixed header set, so that nothing the visitor sent (cookies, user agent,
// language, client hints) can shape the shared page.
function getLoopbackHeaders(): Headers {
  const headers = new Headers({
    [STATUS_CODE_LOOPBACK_HEADER]: 'true',
    'accept': 'text/html',
    'accept-encoding': 'identity',
    'accept-language': 'en-US,en',
    'user-agent': 'LessWrongCachedPostRenderer/1.0',
  });
  // Preview deployments sit behind deployment protection, which the loopback
  // must pass too.
  const protectionBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (protectionBypassSecret) {
    headers.set('x-vercel-protection-bypass', protectionBypassSecret);
  }
  return headers;
}
