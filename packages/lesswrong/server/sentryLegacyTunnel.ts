// The path the browser Sentry SDK posts error reports to (`tunnelRoute` in
// next.config.ts).
const SENTRY_TUNNEL_PATH = "/api/sentry";

const LEGACY_SENTRY_BACKOFF_SECONDS = 24 * 60 * 60;

/**
 * Response for an error report posted to the Sentry tunnel path that the
 * @sentry/nextjs tunnel didn't take, or null for any other path.
 *
 * Since @sentry/nextjs 11, the tunnel only accepts requests with the
 * `application/x-sentry-envelope` content type, which a rewrite sends to
 * /sentry-tunnel before the catch-all API route is reached. Tabs still running
 * a page loaded before the upgrade post `text/plain` reports, which end up in
 * the catch-all route and can't be delivered. A plain 405 left the SDK
 * retrying, so a few tabs stuck in error loops sent over ten million requests
 * a day, each running a function.
 *
 * A 429 with Sentry's rate-limit headers makes the SDK drop everything for a
 * day without sending it (see `updateRateLimits` in @sentry/core), so each
 * such tab sends about one request a day until it is reloaded.
 */
export function legacySentryTunnelResponse(pathname: string): Response | null {
  if (pathname !== SENTRY_TUNNEL_PATH && pathname !== `${SENTRY_TUNNEL_PATH}/`) {
    return null;
  }
  return new Response(null, {
    status: 429,
    headers: {
      "retry-after": String(LEGACY_SENTRY_BACKOFF_SECONDS),
      // <retry_after>:<categories>:<scope>; no categories means all of them.
      "x-sentry-rate-limits": `${LEGACY_SENTRY_BACKOFF_SECONDS}::organization`,
      "cache-control": "no-store",
    },
  });
}
