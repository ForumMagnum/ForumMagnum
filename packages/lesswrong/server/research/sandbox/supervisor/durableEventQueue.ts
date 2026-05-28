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
 * persisted in each line. It never resets or repeats within a log (we don't
 * compact), so the post-persister can derive a stable idempotency key from it
 * for events that lack a Claude message UUID.
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
  /** Advance the persisted acked cursor to `localId` and drop acked entries from memory. */
  ack(conversationId: string, localId: number): void;
  /**
   * Load all on-disk logs into memory (call once at boot). Returns the
   * conversationIds that have un-acked entries needing a drain.
   */
  recover(): string[];
}

interface ConvState {
  /** Un-acked entries, ascending localId. */
  pending: QueuedEntry[];
  /** Next localId to assign. */
  nextLocalId: number;
  /** Last acked localId. */
  cursor: number;
}

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

  function load(conversationId: string): ConvState {
    const existing = states.get(conversationId);
    if (existing) return existing;
    assertValidConversationId(conversationId);
    const cursor = readCursor(conversationId);
    const all = readLog(conversationId);
    const maxLocalId = all.reduce((m, e) => Math.max(m, e.localId), 0);
    const state: ConvState = {
      pending: all.filter((e) => e.localId > cursor),
      nextLocalId: maxLocalId + 1,
      cursor,
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

    ack(conversationId, localId) {
      const state = load(conversationId);
      if (localId <= state.cursor) return;
      state.cursor = localId;
      writeCursor(conversationId, localId);
      state.pending = state.pending.filter((e) => e.localId > localId);
    },

    recover() {
      // `dir` is created in the constructor, so this read is safe; a genuine fs
      // failure here should surface rather than masquerade as "no pending work".
      const files = fs.readdirSync(dir);
      const needDrain: string[] = [];
      for (const file of files) {
        if (!file.endsWith(".ndjson")) continue;
        const conversationId = file.slice(0, -".ndjson".length);
        if (!CONVERSATION_ID_RE.test(conversationId)) continue;
        if (load(conversationId).pending.length > 0) needDrain.push(conversationId);
      }
      return needDrain;
    },
  };
}
