/**
 * Durable single-event POST persister.
 *
 * The supervisor calls `enqueue(conversationId, event)` once per JSONL line.
 * Every event is first appended to a durable on-disk queue (`durableEventQueue`)
 * and only removed once the backend confirms persistence — so a backend/tunnel
 * outage or a supervisor restart can't lose events. A per-conversation drain
 * loop ships pending events in FIFO order to the backend's events endpoint,
 * which server-assigns the seq atomically and dedupes on `(conversationId,
 * claudeMessageUuid)`.
 *
 * Retry policy: transient failures (network, 5xx, 429) and "suspect successes"
 * (200s whose body isn't `{ok:true}` — e.g. a tunnel interstitial while the
 * dev tunnel is down) are retried **indefinitely** with capped exponential
 * backoff. The durable queue is the safety net, so there's no attempt cap to
 * drop events on. Only a genuine permanent 4xx (other than 429) — a malformed
 * event the backend will never accept — is dropped, loudly, after one log.
 *
 * Idempotency: events lacking a Claude message UUID (`system` / `error` /
 * `result`) would not be deduped on retry, so we synthesize a stable,
 * namespaced `sup:<localId>` from the durable queue's per-conversation localId
 * and send it as the `claudeMessageUuid`. It's deterministic across replays
 * (localId is persisted, and never reused thanks to compaction-aware seeding)
 * and collision-proof, so the plain unique index `(conversationId,
 * claudeMessageUuid)` dedupes these too. Every event therefore reaches the
 * backend with a non-null id (the route now requires it). The `sup:` prefix
 * keeps synthetic values distinct from real UUIDs.
 *
 * Endpoint contract: POST /api/research/agent/conversations/:id/events
 *   body: { rawJsonl, kind, claudeMessageUuid, claudeSessionId?, supervisorEmittedAt? }
 *   response: { ok, seq, deduplicated }
 *
 * Failures are logged to the supervisor console.
 */
import { looksLikeOkResponseBody } from "./backendResponseCheck";
import {
  createDurableEventQueue,
  DurableEventQueue,
  QueuedEntry,
} from "./durableEventQueue";

export interface BackendEvent {
  /** Verbatim JSONL line text (canonical) — what the supervisor actually saw on stdout. */
  rawJsonl: string;
  /** One of the backend's accepted kinds. */
  kind: "user" | "assistant" | "tool_use" | "tool_result" | "thinking" | "system" | "error" | "result";
  /** ID from the JSONL line if present, null otherwise. Used for dedupe. */
  claudeMessageUuid: string | null;
  /**
   * The session id from the JSONL line, if present. Informational: the
   * backend validates the field's shape but no longer consumes it (session
   * ids are assigned at conversation creation, not captured from events).
   */
  claudeSessionId?: string;
  /** ISO-8601; backend falls back to its own clock if absent. */
  supervisorEmittedAt?: string;
}

export interface PostPersisterConfig {
  /** Backend base URL, e.g. https://forum.lesswrong.com */
  backendBaseUrl: string;
  /** Bearer token sent on each persistence POST (signed callback token). */
  authToken: string;
  conversationId: string;
  /** Directory backing the durable queue. Default `~/.research/queue`. */
  queueDir?: string;
  /** fetch impl override — useful for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Initial backoff in ms. Default 250. Doubles each attempt up to `maxBackoffMs`. */
  initialBackoffMs?: number;
  /** Cap on per-attempt backoff. Default 30s. */
  maxBackoffMs?: number;
  /** Pre-built queue (tests). If absent one is created from `queueDir`. */
  queue?: DurableEventQueue;
  /** Clock override (tests). */
  now?: () => number;
  /** Sleep override (tests) — lets a test fast-forward backoff. */
  sleepImpl?: (ms: number) => Promise<void>;
}

export interface PostPersister {
  /** Durably enqueue an event and kick its conversation's drain loop. */
  enqueue(conversationId: string, event: BackendEvent): void;
  /** Resume draining the sandbox's own conversation if it has un-acked events. */
  recover(): void;
  /** Best-effort wait for in-flight drains to quiesce (bounded; the queue is durable). */
  drain(deadlineMs?: number): Promise<void>;
  pendingCount(): number;
}

const DEFAULT_QUEUE_DIR = "/root/.research/queue";

type AttemptResult =
  | { kind: "success" }
  | { kind: "transient"; httpStatus: number | null; body: string; networkErr: unknown; suspect: boolean }
  | { kind: "permanent"; httpStatus: number; body: string };

export function createPostPersister(config: PostPersisterConfig): PostPersister {
  const fetchImpl = config.fetchImpl ?? fetch;
  const initialBackoff = config.initialBackoffMs ?? 250;
  const maxBackoff = config.maxBackoffMs ?? 30_000;
  const now = config.now ?? (() => Date.now());
  const sleep = config.sleepImpl ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const queue = config.queue ?? createDurableEventQueue({ dir: config.queueDir ?? DEFAULT_QUEUE_DIR });

  // A conversation is "running" while its drain loop is active. `loops` holds
  // the current loop promise per conversation so `drain()` can await them.
  const running = new Set<string>();
  const loops = new Map<string, Promise<void>>();

  async function attempt(conversationId: string, entry: QueuedEntry): Promise<AttemptResult> {
    const url = `${config.backendBaseUrl}/api/research/agent/conversations/${encodeURIComponent(
      conversationId,
    )}/events`;
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.authToken}`,
        },
        body: JSON.stringify(bodyFor(entry)),
      });
      const text = await res.text();
      if (res.ok) {
        if (looksLikeOkResponseBody(text)) return { kind: "success" };
        // 200 with an unrecognized body — almost always an interceptor between
        // us and the backend (tunnel interstitial, captive portal). Treat it as
        // transient: the tunnel will come back, and the durable queue means we
        // lose nothing by waiting it out.
        return { kind: "transient", httpStatus: res.status, body: text, networkErr: null, suspect: true };
      }
      if (res.status === 429 || res.status >= 500) {
        return { kind: "transient", httpStatus: res.status, body: text, networkErr: null, suspect: false };
      }
      // A genuine permanent 4xx: the backend will never accept this event.
      return { kind: "permanent", httpStatus: res.status, body: text };
    } catch (err) {
      if (isNetworkError(err)) {
        return { kind: "transient", httpStatus: null, body: "", networkErr: err, suspect: false };
      }
      throw err;
    }
  }

  // Ship one entry, retrying transient failures indefinitely with capped
  // backoff. Resolves once the entry is terminal (persisted, or dropped on a
  // permanent 4xx) — either way the caller advances the cursor past it.
  async function ship(conversationId: string, entry: QueuedEntry): Promise<void> {
    for (let attemptNum = 1; ; attemptNum++) {
      const result = await attempt(conversationId, entry);
      if (result.kind === "success") return;
      if (result.kind === "permanent") {
        // eslint-disable-next-line no-console
        console.warn(
          `[postPersister] permanent ${result.httpStatus} for conv=${conversationId} ` +
            `kind=${entry.event.kind} localId=${entry.localId}; dropping event`,
        );
        return;
      }
      // Transient: log periodically so a sustained outage is visible in the
      // supervisor log, then back off and retry indefinitely.
      // eslint-disable-next-line no-console
      console.warn(
        `[postPersister] transient failure (attempt ${attemptNum}) for conv=${conversationId} ` +
          `kind=${entry.event.kind} localId=${entry.localId} ` +
          `status=${result.httpStatus ?? "network"}${result.suspect ? " (suspect 200)" : ""}; retrying`,
      );
      const backoff = Math.min(maxBackoff, initialBackoff * (2 ** (attemptNum - 1)));
      const jitter = Math.floor(Math.random() * (backoff / 4));
      await sleep(backoff + jitter);
    }
  }

  function kick(conversationId: string): void {
    if (running.has(conversationId)) return;
    running.add(conversationId);
    const loop = (async () => {
      try {
        let pend = queue.pending(conversationId);
        while (pend.length > 0) {
          const head = pend[0];
          await ship(conversationId, head);
          queue.ack(conversationId, head.localId);
          pend = queue.pending(conversationId);
        }
      } finally {
        running.delete(conversationId);
        loops.delete(conversationId);
        // Close the race with a concurrent append between the empty-check and
        // here: if something arrived, restart the loop so it isn't stranded.
        if (queue.pending(conversationId).length > 0) kick(conversationId);
      }
    })();
    loops.set(conversationId, loop);
  }

  return {
    enqueue(conversationId, event) {
      queue.append(conversationId, event);
      kick(conversationId);
    },
    recover() {
      if (queue.recover(config.conversationId)) kick(config.conversationId);
    },
    async drain(deadlineMs = 10_000) {
      const start = now();
      while (running.size > 0) {
        await Promise.allSettled([...loops.values()]);
        if (now() - start > deadlineMs) return;
      }
    },
    pendingCount() {
      return queue.pendingCount();
    },
  };
}

// The wire body: synthesize a stable idempotency key for UUID-less events.
function bodyFor(entry: QueuedEntry): BackendEvent {
  const { event, localId } = entry;
  if (event.claudeMessageUuid) return event;
  return { ...event, claudeMessageUuid: `sup:${localId}` };
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error && "code" in err && typeof err.code === "string") {
    return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "UND_ERR_SOCKET", "ENOTFOUND"].includes(err.code);
  }
  return false;
}
