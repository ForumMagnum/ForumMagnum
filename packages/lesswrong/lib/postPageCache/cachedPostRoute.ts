// Imported by middleware.ts; keep free of heavy or node-only dependencies.

// Public path prefix of the route handler (app/cache/posts) that serves
// CDN-cached logged-out post pages. It exists alongside the regular /posts
// route, which it leaves untouched, so that the caching can be exercised in
// isolation.
const CACHED_POST_ROUTE_PREFIX = '/cache/posts';

// Set on the loopback render made by the cached post route handler. Only SSR
// requests carrying it read from and write to the anonymous query cache, so
// that renders of the regular /posts route are unaffected.
export const CACHED_POST_RENDER_HEADER = 'X-LW-Cached-Post-Render';

export function isCachedPostRoutePath(pathname: string): boolean {
  return pathname === CACHED_POST_ROUTE_PREFIX || pathname.startsWith(`${CACHED_POST_ROUTE_PREFIX}/`);
}

export function buildPublicPostPath(postId: string, slug: string | null): string {
  return slug ? `/posts/${postId}/${slug}` : `/posts/${postId}`;
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
