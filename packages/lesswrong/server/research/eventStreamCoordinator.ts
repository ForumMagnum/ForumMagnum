/**
 * Per-instance event-stream coordinator.
 *
 * Clients read a conversation's events over SSE from the backend. Each backend
 * instance may hold many open SSE connections; rather than run one DB-poll loop
 * per connection, this singleton runs ONE poll loop per instance that batches
 * every connected conversation's cursor into a single `getEventsBatchSince`
 * query and fans the resulting rows out to the right subscribers.
 *
 * Why batch: it turns the idle case (open connections, no new events) from
 * O(connections) empty queries per tick into O(1), and collapses the
 * connection-acquire churn that one-query-per-connection would put on the
 * RDS-Proxy pool. The shared in-process registry relies on multiple SSE
 * connections sharing one instance's memory (Fluid Compute), which holds here.
 *
 * The loop runs only while there are subscribers and stops itself when the last
 * one disconnects. A single slow/failed tick is swallowed and retried — the DB
 * is the source of truth, so a dropped tick just delays delivery.
 */
import { sleep } from "@/lib/utils/asyncUtils";
import ResearchConversationEventsRepo from "@/server/repos/ResearchConversationEventsRepo";

/** The event shape delivered to clients — the persisted row minus server-only columns. */
export interface StreamedEventRow {
  _id: string;
  conversationId: string;
  seq: number;
  claudeMessageUuid: string | null;
  kind: string;
  payload: unknown;
  createdAt: string;
}

interface Subscriber {
  conversationId: string;
  /** Highest seq delivered to this subscriber so far. */
  cursor: number;
  push: (rows: StreamedEventRow[]) => void;
}

export interface EventStreamCoordinator {
  /**
   * Stream events for `conversationId` with `seq > sinceSeq` as they land.
   * Returns an unsubscribe function. The poll loop picks the subscription up on
   * its next tick (or starts immediately if it was idle).
   */
  subscribe(conversationId: string, sinceSeq: number, push: (rows: StreamedEventRow[]) => void): () => void;
}

const POLL_INTERVAL_MS = 400;
const LIMIT_PER_CONVERSATION = 200;

function toStreamedRow(row: DbResearchConversationEvent): StreamedEventRow {
  return {
    _id: row._id,
    conversationId: row.conversationId,
    seq: row.seq,
    claudeMessageUuid: row.claudeMessageUuid ?? null,
    kind: row.kind,
    payload: row.payload,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Lowest cursor across a conversation's subscribers — the seq the batched query must reach back to. */
function minCursor(subscribers: Set<Subscriber>): number {
  let min = Infinity;
  for (const sub of subscribers) min = Math.min(min, sub.cursor);
  return min === Infinity ? -1 : min;
}

function createEventStreamCoordinator(): EventStreamCoordinator {
  const repo = new ResearchConversationEventsRepo();
  const subsByConversation = new Map<string, Set<Subscriber>>();
  let looping = false;

  async function deliverTick(): Promise<void> {
    const conversationIds = [...subsByConversation.keys()];
    if (conversationIds.length === 0) return;
    const cursors = conversationIds.map((conversationId) => ({
      conversationId,
      sinceSeq: minCursor(subsByConversation.get(conversationId)!),
    }));

    const rows = await repo.getEventsBatchSince(cursors, LIMIT_PER_CONVERSATION);
    const byConversation = new Map<string, StreamedEventRow[]>();
    for (const row of rows) {
      const streamed = toStreamedRow(row);
      const list = byConversation.get(streamed.conversationId);
      if (list) list.push(streamed);
      else byConversation.set(streamed.conversationId, [streamed]);
    }

    for (const [conversationId, convRows] of byConversation) {
      const subs = subsByConversation.get(conversationId);
      if (!subs) continue;
      for (const sub of subs) {
        const fresh = convRows.filter((r) => r.seq > sub.cursor);
        if (fresh.length === 0) continue;
        sub.cursor = fresh[fresh.length - 1].seq;
        sub.push(fresh);
      }
    }
  }

  // Self-scheduling poll loop. Guarded by `looping` so it never overlaps, and
  // exits (freeing the instance to idle) once the last subscriber leaves.
  async function runLoop(): Promise<void> {
    if (looping) return;
    looping = true;
    try {
      while (subsByConversation.size > 0) {
        try {
          await deliverTick();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[eventStreamCoordinator] tick failed; retrying next interval:", err);
        }
        await sleep(POLL_INTERVAL_MS);
      }
    } finally {
      looping = false;
    }
  }

  return {
    subscribe(conversationId, sinceSeq, push) {
      const sub: Subscriber = { conversationId, cursor: sinceSeq, push };
      let subs = subsByConversation.get(conversationId);
      if (!subs) {
        subs = new Set();
        subsByConversation.set(conversationId, subs);
      }
      subs.add(sub);
      if (!looping) {
        runLoop().catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[eventStreamCoordinator] loop crashed:", err);
        });
      }

      return () => {
        const set = subsByConversation.get(conversationId);
        if (!set) return;
        set.delete(sub);
        if (set.size === 0) subsByConversation.delete(conversationId);
      };
    },
  };
}

// One coordinator per process. Pinned on globalThis so HMR / multiple imports
// in dev share a single loop (same pattern as the pg client singletons).
declare global {
  // eslint-disable-next-line no-var
  var __researchEventStreamCoordinator: EventStreamCoordinator | undefined;
}

export function getEventStreamCoordinator(): EventStreamCoordinator {
  if (!globalThis.__researchEventStreamCoordinator) {
    globalThis.__researchEventStreamCoordinator = createEventStreamCoordinator();
  }
  return globalThis.__researchEventStreamCoordinator;
}
