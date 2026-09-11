/**
 * Heuristic schema check for the events- and heartbeat-POST response bodies.
 *
 * The real backend always responds with `{"ok":true,...}`; tunnels and
 * captive-portal proxies return HTML or JSON of a different shape. Permissive
 * enough that future backend additions (extra fields) don't break this, strict
 * enough that an HTML interstitial won't pass — which is how the post-persister
 * distinguishes a genuine 200 from a tunnel-down "suspect 200".
 *
 * `allowEmpty` controls how an empty body is treated. The events endpoint
 * always includes a JSON body (success or otherwise), so empty body == bad
 * upstream rewrite. The heartbeat endpoint may return 200 with empty body in
 * some configurations, so empty is treated as success there.
 */
export function looksLikeOkResponseBody(
  body: string,
  options: { allowEmpty?: boolean } = {},
): boolean {
  const trimmed = body.trim();
  if (!trimmed) return options.allowEmpty ?? false;
  if (!trimmed.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object"
      && parsed !== null
      && (parsed as { ok?: unknown }).ok === true;
  } catch {
    return false;
  }
}
