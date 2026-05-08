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
 */

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
}

export interface PostPersister {
  enqueue(conversationId: string, event: BackendEvent): void;
  /** Wait for all currently-queued POSTs to drain. */
  drain(): Promise<void>;
}

interface PerConvState {
  inFlight: Promise<void>;
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
    return retrying(async () => {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.authToken}`,
        },
        body: JSON.stringify(event),
      });
      if (res.ok) return;
      if (res.status === 429 || res.status >= 500) {
        throw new TransientError(`backend ${res.status}`);
      }
      // eslint-disable-next-line no-console
      console.warn(
        `[postPersister] permanent ${res.status} for conv=${conversationId} kind=${event.kind} uuid=${event.claudeMessageUuid}; dropping event`,
      );
    }, maxAttempts, initialBackoff).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        `[postPersister] giving up on conv=${conversationId} after ${maxAttempts} attempts:`,
        err,
      );
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

class TransientError extends Error {}

async function retrying(
  fn: () => Promise<void>,
  maxAttempts: number,
  initialBackoffMs: number,
): Promise<void> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await fn();
      return;
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
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    if (code && ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "UND_ERR_SOCKET"].includes(code)) {
      return true;
    }
  }
  return false;
}
