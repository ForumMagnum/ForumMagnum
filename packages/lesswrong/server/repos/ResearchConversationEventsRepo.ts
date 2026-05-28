import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import ResearchConversationEvents from "../collections/researchConversationEvents/collection";
import { randomId } from "@/lib/random";

export interface IncomingResearchConversationEvent {
  claudeMessageUuid: string | null;
  kind: string;
  payload: unknown;
}

export interface PersistEventResult {
  /** The seq number of the persisted (or pre-existing, if deduplicated) row. */
  seq: number;
  /**
   * True iff a row with this `(conversationId, claudeMessageUuid)` already
   * existed and the incoming write was dropped. The supervisor's retry policy
   * uses this to distinguish "I just persisted" from "I already persisted".
   */
  deduplicated: boolean;
}

class ResearchConversationEventsRepo extends AbstractRepo<"ResearchConversationEvents"> {
  constructor(sqlClient?: SqlClient) {
    super(ResearchConversationEvents, sqlClient);
  }

  /**
   * Persist one event from the supervisor's persistence callback. The server
   * assigns `seq` atomically (max(seq)+1 per `conversationId`); the
   * supervisor must NOT pre-assign one. This avoids the gap-on-out-of-order-
   * retry bug we'd hit if seq came from the client.
   *
   * **Ordering invariant**: this function produces the canonical Claude-Code
   * emission order *only because* `postPersister.ts` serializes POSTs into a
   * per-conversation FIFO chain (one in-flight at a time). MAX(seq)+1 has no
   * defense against parallel arrivals; if anyone removes that chain (or runs
   * multiple supervisors writing the same conversation), seqs will be wrong.
   * Touch `postPersister`'s in-flight chain at your peril.
   *
   * Idempotent on `(conversationId, claudeMessageUuid)` when the UUID is
   * non-null. The single-statement form below uses an `INSERT ... ON CONFLICT
   * (conversationId, claudeMessageUuid) DO UPDATE SET seq = seq RETURNING seq`
   * trick to (a) get the existing row's seq back when the conflict fires,
   * (b) atomically claim the next seq when it doesn't. We need DO UPDATE
   * (not DO NOTHING) so RETURNING fires in both branches.
   *
   * If `claudeMessageUuid` is null, no UUID-level dedupe is possible — the
   * supervisor should retry only when network errors leave it unsure whether
   * the previous request succeeded, in which case it should re-send with the
   * same UUID. Events without UUIDs are not retried by the supervisor.
   */
  public async persistEvent(
    conversationId: string,
    event: IncomingResearchConversationEvent,
  ): Promise<PersistEventResult> {
    // Serialize seq assignment per conversation. Without this, concurrent
    // callbacks can both compute MAX(seq)+1 and race on the unique index.
    // For UUID-bearing events: use ON CONFLICT against the unique index on
    // `(conversationId, claudeMessageUuid)`. Postgres allows multiple nulls in
    // unique indexes, so UUID-less events still bypass dedupe.
    if (event.claudeMessageUuid !== null) {
      const result = await this.getRawDb().one<{ seq: number; inserted: boolean }>(`
        WITH lock AS (
          SELECT pg_advisory_xact_lock(hashtext($(conversationId))) AS locked
        ),
        conversation AS (
          SELECT "userId", "projectId"
          FROM "ResearchConversations"
          WHERE "_id" = $(conversationId)
        ),
        next_seq AS (
          SELECT COALESCE(MAX("seq") + 1, 0) AS seq
          FROM lock
          LEFT JOIN "ResearchConversationEvents" ON "conversationId" = $(conversationId)
        ),
        inserted AS (
          INSERT INTO "ResearchConversationEvents"
            ("_id", "userId", "projectId", "conversationId", "seq", "claudeMessageUuid", "kind", "payload", "createdAt")
          SELECT
            $(eventId), conversation."userId", conversation."projectId", $(conversationId), next_seq.seq, $(claudeMessageUuid), $(kind), $(payload)::jsonb, NOW()
          FROM next_seq
          CROSS JOIN conversation
          ON CONFLICT ("conversationId", "claudeMessageUuid")
          WHERE "claudeMessageUuid" IS NOT NULL
          DO NOTHING
          RETURNING "seq"
        )
        SELECT
          COALESCE(
            (SELECT "seq" FROM inserted),
            (SELECT "seq" FROM "ResearchConversationEvents"
              WHERE "conversationId" = $(conversationId)
                AND "claudeMessageUuid" = $(claudeMessageUuid))
          ) AS "seq",
          EXISTS (SELECT 1 FROM inserted) AS "inserted"
      `, {
        eventId: randomId(),
        conversationId,
        claudeMessageUuid: event.claudeMessageUuid,
        kind: event.kind,
        payload: JSON.stringify(event.payload),
      });
      return { seq: result.seq, deduplicated: !result.inserted };
    }

    // No UUID — best-effort assign next seq, no dedupe possible. The CTE
    // computes max+1 (or 0 if no rows) and the INSERT pulls one row from it,
    // so the insert always fires even on the first event.
    const result = await this.getRawDb().one<{ seq: number }>(`
      WITH lock AS (
        SELECT pg_advisory_xact_lock(hashtext($(conversationId))) AS locked
      ),
      conversation AS (
        SELECT "userId", "projectId"
        FROM "ResearchConversations"
        WHERE "_id" = $(conversationId)
      ),
      next_seq AS (
        SELECT COALESCE(MAX("seq") + 1, 0) AS seq
        FROM lock
        LEFT JOIN "ResearchConversationEvents" ON "conversationId" = $(conversationId)
      )
      INSERT INTO "ResearchConversationEvents"
        ("_id", "userId", "projectId", "conversationId", "seq", "claudeMessageUuid", "kind", "payload", "createdAt")
      SELECT
        $(eventId), conversation."userId", conversation."projectId", $(conversationId), next_seq.seq, NULL, $(kind), $(payload)::jsonb, NOW()
      FROM next_seq
      CROSS JOIN conversation
      RETURNING "seq"
    `, {
      eventId: randomId(),
      conversationId,
      kind: event.kind,
      payload: JSON.stringify(event.payload),
    });
    return { seq: result.seq, deduplicated: false };
  }

  /**
   * Tail query for the backend → client event stream: given a set of
   * `(conversationId, sinceSeq)` cursors, return all events with `seq > sinceSeq`
   * for each, in `seq` order, capped at `limitPerConversation` per conversation.
   *
   * One round-trip for every conversation a backend instance is currently
   * streaming (the per-instance coordinator batches its subscribers' cursors
   * into a single call). `unnest` pairs the two arrays into cursor rows and the
   * `LATERAL` subquery rides the `(conversationId, seq)` unique index per
   * conversation, so this stays an indexed range scan regardless of table size.
   */
  public async getEventsBatchSince(
    cursors: { conversationId: string; sinceSeq: number }[],
    limitPerConversation: number,
  ): Promise<DbResearchConversationEvent[]> {
    if (cursors.length === 0) return [];
    return this.getRawDb().any<DbResearchConversationEvent>(`
      -- ResearchConversationEventsRepo.getEventsBatchSince
      SELECT e.*
      FROM unnest($(conversationIds)::text[], $(sinceSeqs)::int[]) AS c("conversationId", "sinceSeq")
      CROSS JOIN LATERAL (
        SELECT *
        FROM "ResearchConversationEvents" ev
        WHERE ev."conversationId" = c."conversationId"
          AND ev."seq" > c."sinceSeq"
        ORDER BY ev."seq" ASC
        LIMIT $(limitPerConversation)
      ) e
      ORDER BY e."conversationId" ASC, e."seq" ASC
    `, {
      conversationIds: cursors.map((c) => c.conversationId),
      sinceSeqs: cursors.map((c) => c.sinceSeq),
      limitPerConversation,
    });
  }

}

recordPerfMetrics(ResearchConversationEventsRepo);
export default ResearchConversationEventsRepo;
