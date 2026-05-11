/**
 * Single-event POST persister with exponential-backoff retry.
 *
 * The supervisor calls `enqueue(conversationId, event)` once per JSONL line.
 * Each event is POSTed as its own request to T3's events endpoint, which
 * server-assigns the seq atomically and dedupes on `(conversationId,
 * claudeMessageUuid)` when the UUID is non-null.
 *
 * On transient failure (network/5xx) we retry with exponential backoff. On 4xx
 * (other than 429) we drop the event after one log — 4xx is a permanent
 * contract violation that retrying won't fix.
 *
 * Per-conversation FIFO ordering is preserved: each conversation has a single
 * in-flight chain of POSTs. Different conversations persist concurrently.
 *
 * Endpoint contract (T3): POST /api/research/agent/conversations/:id/events
 *   body: { rawJsonl, kind, claudeMessageUuid, claudeSessionId?, supervisorEmittedAt? }
 *   response: { ok, seq, deduplicated }
 *
 * Health reporting: every terminal outcome (success or final-give-up) is
 * forwarded to the optional `healthTracker` so the SSE server can surface
 * pipe-degraded state to connected browsers. Suspect successes — 200s whose
 * response body doesn't match `{ok:true}` — are treated as failures here so
 * an upstream tunnel returning a 200 interstitial can't masquerade as a
 * persisted event.
 */
import {
  classifyNetworkError,
  HealthTracker,
  looksLikeOkResponseBody,
  snippetOf,
} from "./healthTracker";

export interface BackendEvent {
  /** Verbatim JSONL line text (canonical) — what the supervisor actually saw on stdout. */
  rawJsonl: string;
  /** One of T3's accepted kinds. */
  kind: "user" | "assistant" | "tool_use" | "tool_result" | "thinking" | "system" | "error" | "result";
  /** ID from the JSONL line if present, null otherwise. Used for dedupe. */
  claudeMessageUuid: string | null;
  /** Optional, sent for cross-checking against conversation.claudeSessionId. */
  claudeSessionId?: string;
  /** ISO-8601; backend falls back to its own clock if absent. */
  supervisorEmittedAt?: string;
}

export interface PostPersisterConfig {
  /** Backend base URL, e.g. https://forum.lesswrong.com */
  backendBaseUrl: string;
  /** Bearer token sent on each persistence POST (signed callback token). */
  authToken: string;
  /** fetch impl override — useful for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Max retry attempts before dropping. Default 6 (~31s of total backoff). */
  maxAttempts?: number;
  /** Initial backoff in ms. Default 250. Doubles each attempt up to ~16s. */
  initialBackoffMs?: number;
  /** Optional health tracker; if present, every terminal outcome is reported. */
  healthTracker?: HealthTracker;
}

export interface PostPersister {
  enqueue(conversationId: string, event: BackendEvent): void;
  /** Wait for all currently-queued POSTs to drain. */
  drain(): Promise<void>;
}

interface PerConvState {
  inFlight: Promise<void>;
}

interface AttemptOutcome {
  outcome: "success" | "permanent_failure" | "suspect_success";
  status?: number;
  body?: string;
}

class TransientError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function createPostPersister(config: PostPersisterConfig): PostPersister {
  const fetchImpl = config.fetchImpl ?? fetch;
  const maxAttempts = config.maxAttempts ?? 6;
  const initialBackoff = config.initialBackoffMs ?? 250;
  const conv = new Map<string, PerConvState>();

  function send(conversationId: string, event: BackendEvent): Promise<void> {
    const url = `${config.backendBaseUrl}/api/research/agent/conversations/${encodeURIComponent(
      conversationId,
    )}/events`;
    let lastFailureSnapshot: {
      attempts: number;
      httpStatus: number | null;
      body: string;
      networkErr: unknown;
    } | null = null;

    return retrying(async (attempt) => {
      try {
        const res = await fetchImpl(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.authToken}`,
          },
          body: JSON.stringify(event),
        });
        const text = await res.text();
        if (res.ok) {
          if (looksLikeOkResponseBody(text)) {
            return { outcome: "success" } as AttemptOutcome;
          }
          // 200 with a body we don't recognize. Almost always means the
          // request was intercepted by something between us and the backend
          // (tunnel interstitial, captive portal, debug HTML page). Don't
          // retry — retrying gets the same interstitial — but flag it.
          lastFailureSnapshot = {
            attempts: attempt + 1,
            httpStatus: res.status,
            body: text,
            networkErr: null,
          };
          return { outcome: "suspect_success", status: res.status, body: text };
        }
        if (res.status === 429 || res.status >= 500) {
          throw new TransientError(`backend ${res.status}`, res.status, text);
        }
        // eslint-disable-next-line no-console
        console.warn(
          `[postPersister] permanent ${res.status} for conv=${conversationId} kind=${event.kind} uuid=${event.claudeMessageUuid}; dropping event`,
        );
        lastFailureSnapshot = {
          attempts: attempt + 1,
          httpStatus: res.status,
          body: text,
          networkErr: null,
        };
        return { outcome: "permanent_failure", status: res.status, body: text };
      } catch (err) {
        if (err instanceof TransientError) {
          lastFailureSnapshot = {
            attempts: attempt + 1,
            httpStatus: err.status,
            body: err.body,
            networkErr: null,
          };
          throw err;
        }
        if (isNetworkError(err)) {
          lastFailureSnapshot = {
            attempts: attempt + 1,
            httpStatus: null,
            body: "",
            networkErr: err,
          };
          throw new TransientError(
            (err as Error).message ?? "network",
            0,
            "",
          );
        }
        throw err;
      }
    }, maxAttempts, initialBackoff)
      .then((outcome) => {
        if (outcome?.outcome === "success") {
          config.healthTracker?.recordSuccess("event_post");
          return;
        }
        // suspect_success or permanent_failure — both surfaced as health failures
        const snap = lastFailureSnapshot ?? {
          attempts: maxAttempts,
          httpStatus: outcome?.status ?? null,
          body: outcome?.body ?? "",
          networkErr: null,
        };
        config.healthTracker?.recordFailure({
          kind: outcome?.outcome === "suspect_success" ? "suspect_success" : "event_post",
          targetUrl: url,
          httpStatus: snap.httpStatus,
          networkError: null,
          responseBodySnippet: snap.body ? snippetOf(snap.body) : null,
          attempts: snap.attempts,
          context: {
            conversationId,
            eventKind: event.kind,
            claudeMessageUuid: event.claudeMessageUuid,
          },
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(
          `[postPersister] giving up on conv=${conversationId} after ${maxAttempts} attempts:`,
          err,
        );
        const snap = lastFailureSnapshot;
        config.healthTracker?.recordFailure({
          kind: "event_post",
          targetUrl: url,
          httpStatus: snap?.httpStatus ?? null,
          networkError: snap?.networkErr ? classifyNetworkError(snap.networkErr) : null,
          responseBodySnippet: snap?.body ? snippetOf(snap.body) : null,
          attempts: snap?.attempts ?? maxAttempts,
          context: {
            conversationId,
            eventKind: event.kind,
            claudeMessageUuid: event.claudeMessageUuid,
          },
        });
      });
  }

  return {
    enqueue(conversationId, event) {
      const existing = conv.get(conversationId) ?? { inFlight: Promise.resolve() };
      existing.inFlight = existing.inFlight.then(() => send(conversationId, event));
      conv.set(conversationId, existing);
    },
    async drain() {
      await Promise.all([...conv.values()].map((s) => s.inFlight));
    },
  };
}

async function retrying(
  fn: (attempt: number) => Promise<AttemptOutcome>,
  maxAttempts: number,
  initialBackoffMs: number,
): Promise<AttemptOutcome | undefined> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (!(err instanceof TransientError) && !isNetworkError(err)) {
        throw err;
      }
      if (attempt < maxAttempts - 1) {
        const backoff = initialBackoffMs * 2 ** attempt;
        const jitter = Math.floor(Math.random() * (backoff / 4));
        await new Promise((r) => setTimeout(r, backoff + jitter));
      }
    }
  }
  throw lastErr;
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TransientError) return false;
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    if (code && ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "UND_ERR_SOCKET", "ENOTFOUND"].includes(code)) {
      return true;
    }
  }
  return false;
}
