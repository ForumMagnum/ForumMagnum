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
    // For UUID-bearing events: use ON CONFLICT against the partial unique
    // index `(conversationId, claudeMessageUuid) WHERE claudeMessageUuid IS NOT NULL`.
    // The DO UPDATE SET ... is a no-op write that lets RETURNING fire so the
    // caller sees the existing seq even when no insert happened.
    if (event.claudeMessageUuid !== null) {
      const result = await this.getRawDb().one<{ seq: number; inserted: boolean }>(`
        WITH next_seq AS (
          SELECT COALESCE(MAX("seq") + 1, 0) AS seq
          FROM "ResearchConversationEvents"
          WHERE "conversationId" = $(conversationId)
        ),
        inserted AS (
          INSERT INTO "ResearchConversationEvents"
            ("_id", "conversationId", "seq", "claudeMessageUuid", "kind", "payload", "createdAt")
          SELECT
            $(eventId), $(conversationId), next_seq.seq, $(claudeMessageUuid), $(kind), $(payload)::jsonb, NOW()
          FROM next_seq
          ON CONFLICT ("conversationId", "claudeMessageUuid") DO NOTHING
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
      WITH next_seq AS (
        SELECT COALESCE(MAX("seq") + 1, 0) AS seq
        FROM "ResearchConversationEvents"
        WHERE "conversationId" = $(conversationId)
      )
      INSERT INTO "ResearchConversationEvents"
        ("_id", "conversationId", "seq", "claudeMessageUuid", "kind", "payload", "createdAt")
      SELECT
        $(eventId), $(conversationId), next_seq.seq, NULL, $(kind), $(payload)::jsonb, NOW()
      FROM next_seq
      RETURNING "seq"
    `, {
      eventId: randomId(),
      conversationId,
      kind: event.kind,
      payload: JSON.stringify(event.payload),
    });
    return { seq: result.seq, deduplicated: false };
  }

  public async getEventsForConversation(
    conversationId: string,
    options: { sinceSeq?: number; limit?: number } = {},
  ): Promise<DbResearchConversationEvent[]> {
    const sinceSeq = options.sinceSeq ?? -1;
    const limit = options.limit ?? 1000;
    return this.any(`
      SELECT *
      FROM "ResearchConversationEvents"
      WHERE "conversationId" = $(conversationId)
        AND "seq" > $(sinceSeq)
      ORDER BY "seq" ASC
      LIMIT $(limit)
    `, { conversationId, sinceSeq, limit });
  }
}

recordPerfMetrics(ResearchConversationEventsRepo);
export default ResearchConversationEventsRepo;
