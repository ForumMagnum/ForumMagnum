/**
 * In-memory tracker for supervisor → backend pipe health.
 *
 * The supervisor is the only thing that knows whether its outbound POSTs are
 * landing — when the pipe is broken, the supervisor can't tell the backend
 * "the pipe is broken." This tracker collects success/failure observations
 * from the post-persister and heartbeat modules, computes an aggregate
 * health status, and exposes both a snapshot read and a transition
 * subscription that the SSE server uses to push status to clients on the
 * unbroken supervisor → browser channel.
 *
 * Failure modes the tracker is designed to surface:
 *   - HTTP 5xx / 4xx from the backend (real or proxied).
 *   - Network errors (DNS, connection refused, timeout, TLS).
 *   - Suspicious 200s where the response body doesn't match the expected
 *     JSON schema (caught e.g. when a tunnel returns a 200 interstitial).
 */

export type HealthStatus = "healthy" | "unhealthy";

export type HealthFailureKind = "event_post" | "heartbeat" | "suspect_success";

export type HealthNetworkErrorClass =
  | "dns_unresolved"
  | "connection_refused"
  | "timeout"
  | "tls_failed"
  | "other";

export interface HealthFailureContext {
  conversationId?: string;
  eventKind?: string;
  claudeMessageUuid?: string | null;
}

export interface HealthFailureDetail {
  at: number;
  kind: HealthFailureKind;
  targetUrl: string;
  httpStatus: number | null;
  networkError: HealthNetworkErrorClass | null;
  responseBodySnippet: string | null;
  attempts: number;
  context: HealthFailureContext;
}

export interface SupervisorHealth {
  status: HealthStatus;
  consecutiveFailures: number;
  lastSuccessAt: number | null;
  droppedEventCount: number;
  lastFailure: HealthFailureDetail | null;
}

export type HealthListener = (snapshot: SupervisorHealth) => void;

export interface HealthTracker {
  recordSuccess(kind: "event_post" | "heartbeat"): void;
  recordFailure(detail: Omit<HealthFailureDetail, "at"> & { at?: number }): void;
  getSnapshot(): SupervisorHealth;
  /**
   * Fires on every transition between healthy/unhealthy AND on every newly
   * recorded failure (so the SSE server can stream per-failure detail to
   * already-connected clients without dropping intermediate failures into a
   * single coalesced "unhealthy" event).
   */
  subscribe(listener: HealthListener): () => void;
}

export interface HealthTrackerConfig {
  /** Consecutive failures before status flips to "unhealthy". Default 3. */
  unhealthyThreshold?: number;
  /** Override clock for tests. */
  now?: () => number;
}

export function createHealthTracker(config: HealthTrackerConfig = {}): HealthTracker {
  const threshold = config.unhealthyThreshold ?? 3;
  const now = config.now ?? (() => Date.now());

  let consecutiveFailures = 0;
  let lastSuccessAt: number | null = null;
  let droppedEventCount = 0;
  let lastFailure: HealthFailureDetail | null = null;
  const listeners = new Set<HealthListener>();

  function computeStatus(): HealthStatus {
    return consecutiveFailures >= threshold ? "unhealthy" : "healthy";
  }

  function snapshot(): SupervisorHealth {
    return {
      status: computeStatus(),
      consecutiveFailures,
      lastSuccessAt,
      droppedEventCount,
      lastFailure,
    };
  }

  function notify() {
    const s = snapshot();
    for (const listener of listeners) {
      try {
        listener(s);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[healthTracker] listener threw:", err);
      }
    }
  }

  return {
    recordSuccess(_kind) {
      const wasUnhealthy = computeStatus() === "unhealthy";
      consecutiveFailures = 0;
      lastSuccessAt = now();
      // Notify on every transition out of unhealthy. Successes during a
      // healthy run don't notify — we'd flood the SSE channel.
      if (wasUnhealthy) notify();
    },
    recordFailure(detail) {
      consecutiveFailures += 1;
      droppedEventCount += 1;
      lastFailure = {
        at: detail.at ?? now(),
        kind: detail.kind,
        targetUrl: detail.targetUrl,
        httpStatus: detail.httpStatus,
        networkError: detail.networkError,
        responseBodySnippet: detail.responseBodySnippet,
        attempts: detail.attempts,
        context: detail.context,
      };
      // Always notify on failure: clients want per-failure detail, not just
      // the moment of transition.
      notify();
    },
    getSnapshot: snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Truncate a response body for inclusion in a failure detail. */
export function snippetOf(body: string, max = 200): string {
  if (body.length <= max) return body;
  return body.slice(0, max) + "…";
}

/**
 * Heuristic schema check for the events- and heartbeat-POST response bodies.
 * Real backend always responds with `{"ok":true,...}`; tunnels and captive-
 * portal proxies return HTML or JSON of a different shape. Permissive enough
 * that future backend additions (extra fields) don't break this, strict
 * enough that an HTML page won't pass.
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

/** Map a thrown fetch error to one of the network-error classes. */
export function classifyNetworkError(err: unknown): HealthNetworkErrorClass {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    const code = (err as { code?: string }).code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN" || msg.includes("getaddrinfo")) {
      return "dns_unresolved";
    }
    if (code === "ECONNREFUSED" || msg.includes("econnrefused")) {
      return "connection_refused";
    }
    if (code === "ETIMEDOUT" || msg.includes("timeout") || msg.includes("timed out")) {
      return "timeout";
    }
    if (msg.includes("tls") || msg.includes("certificate") || msg.includes("ssl")) {
      return "tls_failed";
    }
  }
  return "other";
}
