/**
 * HMAC-signed bearer token validation for the supervisor.
 *
 * The Vercel-routed sandbox URL is open to the internet by default — this
 * module is the in-process auth layer keeping it from being a free-for-all.
 *
 * Token shape (compact, no JWT framework needed in-sandbox):
 *   base64url(JSON.stringify({sandboxId, expiresAt, scope?})) + "." + base64url(HMAC-SHA256(payload, SUPERVISOR_SECRET))
 *
 * `SUPERVISOR_SECRET` is shared between the backend (which mints tokens) and
 * the supervisor (which validates them); it's injected at sandbox-create time
 * via the `env` field. The backend never persists the token itself, only the
 * secret in `ResearchSandboxSessions.supervisorSecret`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface SupervisorTokenPayload {
  sandboxId: string;
  expiresAt: number;
  /** Optional finer-grained scope, e.g. a conversationId. */
  scope?: string;
}

/**
 * Token `scope` for a dev-preview token — signed by `mintDevPreviewUrl` and
 * validated by the in-sandbox auth-proxy. Shared so the two sides cannot drift.
 */
export const DEVAUTH_SCOPE = "devauth";

function base64UrlEncode(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, "base64");
}

export function signSupervisorToken(
  payload: SupervisorTokenPayload,
  secret: string,
): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = base64UrlEncode(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export type ValidationResult =
  | { ok: true; payload: SupervisorTokenPayload }
  | { ok: false; reason: string };

export function validateSupervisorToken(
  token: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): ValidationResult {
  if (!token) return { ok: false, reason: "missing token" };
  const dot = token.indexOf(".");
  if (dot < 0) return { ok: false, reason: "malformed token" };
  const body = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  const expectedSigB64 = base64UrlEncode(createHmac("sha256", secret).update(body).digest());
  const a = Buffer.from(expectedSigB64);
  const b = Buffer.from(providedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad signature" };
  }

  let payload: SupervisorTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "unparseable payload" };
  }
  if (typeof payload.expiresAt !== "number" || payload.expiresAt < now) {
    return { ok: false, reason: "expired" };
  }
  if (typeof payload.sandboxId !== "string" || !payload.sandboxId) {
    return { ok: false, reason: "missing sandboxId" };
  }
  return { ok: true, payload };
}

export function supervisorTokenCanAccessConversation(
  payload: SupervisorTokenPayload,
  conversationId: string,
): boolean {
  return payload.scope === conversationId;
}

/**
 * Extract a bearer token from `Authorization` or, as a fallback, a `?token=` query.
 * SSE clients can't easily set headers cross-origin, so the query fallback is
 * a documented-but-discouraged option for the SSE endpoint specifically.
 */
export function extractBearer(req: {
  headers: Record<string, string | string[] | undefined>;
  url?: string;
}): string | null {
  const authHeader = req.headers.authorization;
  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim();
  }
  if (req.url) {
    const qIdx = req.url.indexOf("?");
    if (qIdx >= 0) {
      const params = new URLSearchParams(req.url.slice(qIdx + 1));
      const t = params.get("token");
      if (t) return t;
    }
  }
  return null;
}
