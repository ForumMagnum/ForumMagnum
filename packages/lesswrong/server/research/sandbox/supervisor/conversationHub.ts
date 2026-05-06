/**
 * Per-conversation event hub.
 *
 * Holds the live runner handle, a small ring buffer of recent events for
 * `?since=<seq>` SSE replay, and the set of SSE subscribers for that
 * conversation. Each parsed JSONL line is fanned out twice:
 *
 *   1. To every active SSE subscriber on this conversation.
 *   2. To `postPersister` for durable persistence to the backend.
 *
 * Persistence is independent of subscriber presence — a conversation that
 * runs while no client is connected still ends up fully persisted.
 *
 * Sequence numbers (`seq`) are local to the supervisor — they're not the
 * authoritative seq from the backend (which assigns its own). They exist
 * only so SSE clients can resume mid-stream from the supervisor's buffer.
 */
import { ClaudeEventKind, ParsedJsonlLine } from "./jsonlParser";
import { ClaudeRunnerHandle, startClaudeRunner } from "./claudeRunner";
import { BackendEvent, PostPersister } from "./postPersister";
import { writeBootstrapJsonl } from "./sessionBootstrap";
import { ConversationState, SseSink, SseUnsubscribe } from "./server";

export interface ConversationHubConfig {
  postPersister: PostPersister;
  /** Max events kept in the per-conversation ring buffer for SSE replay. */
  bufferSize?: number;
  /** Override clock for tests. */
  now?: () => number;
}

interface BufferedEvent {
  seq: number;
  rawJsonl: string;
  kind: string;
  emittedAt: number;
}

interface ConversationEntry {
  conversationId: string;
  state: ConversationState;
  buffer: BufferedEvent[];
  nextSeq: number;
  subscribers: Set<SseSink>;
  runner: ClaudeRunnerHandle | null;
  claudeSessionId?: string;
}

export interface DispatchInput {
  conversationId: string;
  prompt: string;
  /**
   * If set, runs `claude -p ... --resume <id>`. Must point at an existing
   * session JSONL on disk, OR be combined with `bootstrapJsonl` so the
   * supervisor synthesizes the file from prior persisted events first.
   */
  claudeSessionId?: string;
  /**
   * Verbatim JSONL lines from prior `ResearchConversationEvents`, in seq order.
   * If non-empty, the hub writes them to the Claude Code session dir before
   * spawning so `--resume` finds the history. Each entry is one line of text.
   */
  bootstrapJsonl?: string[];
}

export function createConversationHub(config: ConversationHubConfig) {
  const bufferSize = config.bufferSize ?? 1024;
  const now = config.now ?? (() => Date.now());
  const conversations = new Map<string, ConversationEntry>();

  function getOrInit(conversationId: string): ConversationEntry {
    const existing = conversations.get(conversationId);
    if (existing) return existing;
    const entry: ConversationEntry = {
      conversationId,
      state: { conversationId, status: "idle" },
      buffer: [],
      nextSeq: 0,
      subscribers: new Set(),
      runner: null,
    };
    conversations.set(conversationId, entry);
    return entry;
  }

  function emit(entry: ConversationEntry, line: ParsedJsonlLine) {
    const seq = entry.nextSeq++;
    const buf: BufferedEvent = {
      seq,
      rawJsonl: line.raw,
      kind: line.kind,
      emittedAt: now(),
    };
    entry.buffer.push(buf);
    if (entry.buffer.length > bufferSize) entry.buffer.shift();

    // Send SSE in the shape the client's `useConversationStream` consumes
    // (mirrors `ResearchConversationEvent` minus the `_id` and DB createdAt).
    // The persistence path POSTs the same content separately to the backend.
    let parsedPayload: unknown = line.raw;
    try {
      parsedPayload = JSON.parse(line.raw);
    } catch {
      /* raw line wasn't JSON — pass through as a string */
    }
    const sseData = JSON.stringify({
      conversationId: entry.conversationId,
      seq,
      kind: line.kind,
      claudeMessageUuid: line.claudeMessageUuid ?? null,
      payload: parsedPayload,
    });
    const sseEvent = { event: "jsonl", data: sseData, id: String(seq) };
    for (const sink of entry.subscribers) {
      try {
        sink(sseEvent);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[hub] sse sink threw for conv=${entry.conversationId}:`, err);
      }
    }

    const persistKind = mapKindForPersistence(line.kind);
    if (persistKind) {
      config.postPersister.enqueue(entry.conversationId, {
        rawJsonl: line.raw,
        kind: persistKind,
        claudeMessageUuid: line.claudeMessageUuid,
        claudeSessionId: line.sessionId ?? undefined,
        supervisorEmittedAt: new Date(buf.emittedAt).toISOString(),
      });
    }

    if (line.sessionId && !entry.claudeSessionId) {
      entry.claudeSessionId = line.sessionId;
    }
  }

  function subscribe(conversationId: string, sink: SseSink, sinceSeq?: number): SseUnsubscribe {
    const entry = getOrInit(conversationId);
    entry.subscribers.add(sink);

    if (typeof sinceSeq === "number") {
      const replay = entry.buffer.filter((e) => e.seq > sinceSeq);
      for (const r of replay) {
        try {
          let parsedPayload: unknown = r.rawJsonl;
          try { parsedPayload = JSON.parse(r.rawJsonl); } catch { /* string */ }
          const data = JSON.stringify({
            conversationId: entry.conversationId,
            seq: r.seq,
            kind: r.kind,
            claudeMessageUuid: null,
            payload: parsedPayload,
          });
          sink({ event: "jsonl", data, id: String(r.seq) });
        } catch {
          /* swallow */
        }
      }
    }

    return () => {
      entry.subscribers.delete(sink);
    };
  }

  async function dispatch(
    input: DispatchInput,
    runnerEnv?: Record<string, string>,
  ): Promise<{ accepted: boolean; reason?: string }> {
    const entry = getOrInit(input.conversationId);
    if (entry.runner && entry.state.status === "running") {
      return { accepted: false, reason: "already running" };
    }

    if (input.claudeSessionId && input.bootstrapJsonl && input.bootstrapJsonl.length > 0) {
      try {
        await writeBootstrapJsonl(
          { claudeSessionId: input.claudeSessionId, cwd: runnerEnv?.CWD },
          input.bootstrapJsonl.map((line) => ({ payload: line })),
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[hub] bootstrap write failed for conv=${input.conversationId} session=${input.claudeSessionId}:`,
          err,
        );
        return { accepted: false, reason: "bootstrap_failed" };
      }
    }

    entry.state = { conversationId: input.conversationId, status: "running", startedAt: now() };
    entry.claudeSessionId = input.claudeSessionId ?? entry.claudeSessionId;

    const runner = startClaudeRunner({
      conversationId: input.conversationId,
      prompt: input.prompt,
      claudeSessionId: input.claudeSessionId,
      env: runnerEnv,
      onLine: (line) => emit(entry, line),
      onExit: ({ code }) => {
        entry.state = {
          ...entry.state,
          status:
            entry.state.status === "cancelled"
              ? "cancelled"
              : code === 0
              ? "completed"
              : "errored",
          endedAt: now(),
        };
        entry.runner = null;
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error(`[hub] runner error conv=${input.conversationId}:`, err);
      },
      onStderr: (chunk) => {
        // eslint-disable-next-line no-console
        console.error(`[hub] claude stderr conv=${input.conversationId}: ${chunk}`);
      },
    });
    entry.runner = runner;
    return { accepted: true };
  }

  async function cancel(conversationId: string): Promise<void> {
    const entry = conversations.get(conversationId);
    if (!entry || !entry.runner) return;
    entry.state = { ...entry.state, status: "cancelled" };
    entry.runner.cancel("SIGTERM");
    // SIGKILL fallback if still running after grace period
    setTimeout(() => {
      const still = conversations.get(conversationId);
      if (still?.runner) still.runner.cancel("SIGKILL");
    }, 5_000);
  }

  function snapshot(): {
    conversations: ConversationState[];
    concurrencyCount: number;
  } {
    const states = [...conversations.values()].map((e) => e.state);
    const running = states.filter((s) => s.status === "running").length;
    return { conversations: states, concurrencyCount: running };
  }

  function getEntry(conversationId: string): ConversationEntry | undefined {
    return conversations.get(conversationId);
  }

  return {
    dispatch,
    cancel,
    subscribe,
    snapshot,
    getEntry,
  };
}

export type ConversationHub = ReturnType<typeof createConversationHub>;

/**
 * Translate the parser-detected kind into one of T3's accepted persistence
 * kinds. Returns null for kinds we drop on the floor:
 *  - "result"  — the final summary line (we surface this via /status, not events)
 *  - "unknown" — unrecognized line shape; SSE'd but not persisted to keep the
 *               persistence schema strict. Backend can reject these explicitly.
 */
function mapKindForPersistence(kind: ClaudeEventKind): BackendEvent["kind"] | null {
  switch (kind) {
    case "user":
    case "assistant":
    case "tool_use":
    case "tool_result":
    case "thinking":
    case "system":
    case "error":
      return kind;
    case "result":
    case "unknown":
      return null;
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return null;
    }
  }
}
