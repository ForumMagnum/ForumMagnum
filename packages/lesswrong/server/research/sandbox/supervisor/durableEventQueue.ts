/**
 * Durable, append-only per-conversation event queue backed by the sandbox disk.
 *
 * Each event the supervisor emits is appended here *before* it's shipped to the
 * backend, and is only removed from the pending set once the backend confirms
 * persistence (the post-persister advances the acked cursor via `ack`). Because
 * the sandbox disk is snapshotted on idle-stop and restored on resume, the log
 * and cursor survive across sessions: a supervisor that boots into a restored
 * snapshot calls `recover()` and re-drains anything the previous session hadn't
 * gotten an ack for, so a tunnel outage or a process restart doesn't lose
 * un-acked events.
 *
 * Layout (one sandbox runs exactly one conversation, so in practice there's a
 * single pair of files, but the API is keyed by conversationId for generality):
 *   <dir>/<conversationId>.ndjson   append-only log, one JSON `QueuedEntry` per line
 *   <dir>/<conversationId>.cursor   last acked localId (plain integer text)
 *
 * `localId` is a per-conversation monotonic counter assigned at append time and
 * persisted in each line. It must never reset or repeat within a conversation's
 * lifetime, so the post-persister can derive a stable idempotency key
 * (`sup:<localId>`) from it for events that lack a Claude message UUID. Because
 * the log is compacted (entries at/under the acked cursor are dropped), the
 * counter is seeded from `max(maxLocalId, cursor) + 1` — seeding from the log's
 * max alone would reset to 1 once compaction empties the log and re-issue
 * `sup:1, sup:2, …`, which the backend would dedup against already-persisted
 * ids, silently dropping genuinely new events.
 *
 * Durability note: appends use `appendFileSync` (a single write of one line) but
 * not `fsync`. That's sufficient for the dominant failure mode (backend
 * unreachable) and for the idle-stop snapshot (writes are flushed by then). A
 * hard process kill within the OS write-back window could lose the last append;
 * that's an accepted edge — the agent's own on-disk session JSONL remains the
 * authoritative record of its context, and this is a rare race.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { BackendEvent } from "./postPersister";

export interface QueuedEntry {
  /** Per-conversation monotonic id, assigned at append and persisted in the line. */
  localId: number;
  event: BackendEvent;
}

export interface DurableEventQueueConfig {
  /** Directory the per-conversation log + cursor files live in. Created if absent. */
  dir: string;
}

export interface DurableEventQueue {
  /** Durably append an event and return its assigned entry. */
  append(conversationId: string, event: BackendEvent): QueuedEntry;
  /** Un-acked entries (localId > cursor) in ascending localId order. */
  pending(conversationId: string): QueuedEntry[];
  pendingCount(): number;
  /** Advance the persisted acked cursor to `localId` and drop acked entries from memory. */
  ack(conversationId: string, localId: number): void;
  /**
   * Load this sandbox's own conversation log into memory (call once at boot).
   * Returns whether it has un-acked entries needing a drain. **Conversation-
   * scoped**: a forked child's snapshot physically contains the *source's* queue
   * files, so an unscoped recovery could re-ship the source's events
   * (cross-conversation injection). We only ever recover the sandbox's own
   * conversation.
   */
  recover(conversationId: string): boolean;
}

interface ConvState {
  /** Un-acked entries, ascending localId. */
  pending: QueuedEntry[];
  /** Next localId to assign. */
  nextLocalId: number;
  /** Last acked localId. */
  cursor: number;
  compactedAtCursor: number;
}

const COMPACT_THRESHOLD = 64;

// conversationIds are `randomId()` output (alphanumeric); validated so they're
// safe to use directly as filenames and can't escape the queue dir.
const CONVERSATION_ID_RE = /^[A-Za-z0-9_-]+$/;

function assertValidConversationId(conversationId: string): void {
  if (!CONVERSATION_ID_RE.test(conversationId)) {
    throw new Error(`durableEventQueue: unsafe conversationId ${JSON.stringify(conversationId)}`);
  }
}

export function createDurableEventQueue(config: DurableEventQueueConfig): DurableEventQueue {
  const { dir } = config;
  fs.mkdirSync(dir, { recursive: true });

  const states = new Map<string, ConvState>();

  function logPath(conversationId: string): string {
    return path.join(dir, `${conversationId}.ndjson`);
  }
  function cursorPath(conversationId: string): string {
    return path.join(dir, `${conversationId}.cursor`);
  }

  function readCursor(conversationId: string): number {
    try {
      const raw = fs.readFileSync(cursorPath(conversationId), "utf8").trim();
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  }

  function writeCursor(conversationId: string, cursor: number): void {
    // Write-then-rename so a crash mid-write can't leave a torn cursor file
    // (which would re-ship already-persisted events — harmless thanks to
    // dedup, but wasteful).
    const tmp = `${cursorPath(conversationId)}.tmp`;
    fs.writeFileSync(tmp, String(cursor), "utf8");
    fs.renameSync(tmp, cursorPath(conversationId));
  }

  function readLog(conversationId: string): QueuedEntry[] {
    let raw: string;
    try {
      raw = fs.readFileSync(logPath(conversationId), "utf8");
    } catch {
      return [];
    }
    const entries: QueuedEntry[] = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed?.localId === "number" && parsed?.event) {
          entries.push({ localId: parsed.localId, event: parsed.event });
        }
      } catch {
        // A torn final line (process killed mid-append) is skipped; the event
        // it represented was never acked, so the backend never saw it and the
        // record is consistent.
      }
    }
    return entries;
  }

  function compact(conversationId: string, pending: QueuedEntry[]): void {
    const body = pending.map((e) => `${JSON.stringify(e)}\n`).join("");
    const tmp = `${logPath(conversationId)}.tmp`;
    fs.writeFileSync(tmp, body, "utf8");
    fs.renameSync(tmp, logPath(conversationId));
  }

  function load(conversationId: string): ConvState {
    const existing = states.get(conversationId);
    if (existing) return existing;
    assertValidConversationId(conversationId);
    const cursor = readCursor(conversationId);
    const all = readLog(conversationId);
    const maxLocalId = all.reduce((m, e) => Math.max(m, e.localId), 0);
    const state: ConvState = {
      pending: all.filter((e) => e.localId > cursor),
      nextLocalId: Math.max(maxLocalId, cursor) + 1,
      cursor,
      compactedAtCursor: cursor,
    };
    states.set(conversationId, state);
    return state;
  }

  return {
    append(conversationId, event) {
      const state = load(conversationId);
      const entry: QueuedEntry = { localId: state.nextLocalId++, event };
      fs.appendFileSync(logPath(conversationId), `${JSON.stringify(entry)}\n`, "utf8");
      state.pending.push(entry);
      return entry;
    },

    pending(conversationId) {
      return [...load(conversationId).pending];
    },

    pendingCount() {
      let total = 0;
      for (const state of states.values()) total += state.pending.length;
      return total;
    },

    ack(conversationId, localId) {
      const state = load(conversationId);
      if (localId <= state.cursor) return;
      state.cursor = localId;
      writeCursor(conversationId, localId);
      state.pending = state.pending.filter((e) => e.localId > localId);
      // Order matters: the cursor is advanced (and fsync-renamed)
      // first, so a crash before compaction just leaves acked entries the next
      // load filters out by cursor; never the reverse.
      if (state.pending.length === 0 || state.cursor - state.compactedAtCursor >= COMPACT_THRESHOLD) {
        compact(conversationId, state.pending);
        state.compactedAtCursor = state.cursor;
      }
    },

    recover(conversationId) {
      assertValidConversationId(conversationId);
      return load(conversationId).pending.length > 0;
    },
  };
}
