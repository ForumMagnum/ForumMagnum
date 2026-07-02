import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import ResearchConversationEvents from "../collections/researchConversationEvents/collection";
import { randomId } from "@/lib/random";
import { isPostgresUniqueViolation } from "@/server/utils/postgresErrors";
import {
  TURN_ACTIVITY_EVENT_KINDS,
  TURN_OPENING_SYSTEM_SUBTYPE,
} from "@/lib/research/turnActivity";

export interface IncomingResearchConversationEvent {
  claudeMessageUuid: string;
  kind: string;
  payload: unknown;
}

const SEQ_RETRY_ATTEMPTS = 5;

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
   * **No advisory lock; single writer in the common case; retry as backstop.**
   * The supervisor's per-conversation FIFO drain is the sole writer per
   * conversation, so the common case is correctly ordered and collision-free
   * with no lock. (The advisory lock was dropped: under RDS Proxy it pins the
   * connection and defeats pooling.) As a uniqueness backstop, a
   * `(conversationId, seq)` unique violation — which a stray concurrent writer
   * could provoke — is retried, re-deriving `MAX(seq)+1`.
   */
  public async persistEvent(
    conversationId: string,
    event: IncomingResearchConversationEvent,
  ): Promise<PersistEventResult> {
    if (!event.claudeMessageUuid) {
      throw new Error("persistEvent: claudeMessageUuid is required (non-null)");
    }
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < SEQ_RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await this.getRawDb().one<{ seq: number; inserted: boolean }>(`
          WITH conversation AS (
            SELECT "userId", "projectId"
            FROM "ResearchConversations"
            WHERE "_id" = $(conversationId)
          ),
          next_seq AS (
            SELECT COALESCE(MAX("seq") + 1, 0) AS seq
            FROM "ResearchConversationEvents"
            WHERE "conversationId" = $(conversationId)
          ),
          inserted AS (
            INSERT INTO "ResearchConversationEvents"
              ("_id", "userId", "projectId", "conversationId", "seq", "claudeMessageUuid", "kind", "payload", "createdAt")
            SELECT
              $(eventId), conversation."userId", conversation."projectId", $(conversationId), next_seq.seq, $(claudeMessageUuid), $(kind), $(payload)::jsonb, NOW()
            FROM next_seq
            CROSS JOIN conversation
            ON CONFLICT ("conversationId", "claudeMessageUuid")
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
      } catch (err) {
        if (isPostgresUniqueViolation(err)) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw lastErr ?? new Error("persistEvent: exhausted seq retries");
  }

  /**
   * Backfill a "with"-environment branch: copy the source conversation's events
   * with `seq ≤ branchSeq` into the target conversation `Y`, in one synchronous
   * `INSERT … SELECT`. Runs before `Y` accepts any turn, so no lock is needed
   * (single writer). Per the design's "Spawning a conversation from an
   * environment":
   *  - a fresh `_id` per row;
   *  - `conversationId`/`userId`/`projectId` set to `Y`'s;
   *  - `seq` preserved verbatim (the copied prefix is contiguous `0..N`, so
   *    `Y`'s first turn gets `N+1` from `MAX(seq)+1`);
   *  - `createdAt = NOW()` (display orders by `seq`, not insert time);
   *  - synthetic idempotency ids rewritten to a flat `bf:<source _id>`
   *    (collision-proof even across repeated branching A→B→C), real Claude
   *    UUIDs copied through unchanged.
   */
  public async backfillFromBranch(args: {
    sourceConversationId: string;
    targetConversationId: string;
    targetUserId: string;
    targetProjectId: string;
    branchSeq: number;
  }): Promise<void> {
    await this.getRawDb().none(`
      -- ResearchConversationEventsRepo.backfillFromBranch
      INSERT INTO "ResearchConversationEvents"
        ("_id", "userId", "projectId", "conversationId", "seq", "claudeMessageUuid", "kind", "payload", "createdAt")
      SELECT
        -- A fresh random _id per row (≤ VARCHAR(27); never read back by _id, so
        -- the non-app id format is harmless). Random — not derived from the
        -- source _id — so branching one environment into several conversations
        -- can't collide on the global _id PK.
        substr(md5(random()::text || src."_id"), 1, 24),
        $(targetUserId),
        $(targetProjectId),
        $(targetConversationId),
        src."seq",
        -- Rewrite synthetic idempotency ids (sup:/bf:) to a flat bf:<source _id>:
        -- a flat prefix is collision-proof even across repeated branching
        -- (A-to-B-to-C), where a row may already carry an inherited bf: id from an
        -- earlier branch. Real Claude UUIDs copy through unchanged.
        CASE
          WHEN src."claudeMessageUuid" LIKE 'sup:%' OR src."claudeMessageUuid" LIKE 'bf:%'
            THEN 'bf:' || src."_id"
          ELSE src."claudeMessageUuid"
        END,
        src."kind",
        src."payload",
        NOW()
      FROM "ResearchConversationEvents" src
      WHERE src."conversationId" = $(sourceConversationId)
        AND src."seq" <= $(branchSeq)
    `, {
      sourceConversationId: args.sourceConversationId,
      targetConversationId: args.targetConversationId,
      targetUserId: args.targetUserId,
      targetProjectId: args.targetProjectId,
      branchSeq: args.branchSeq,
    });
  }

  /**
   * Whether the conversation's most recent turn is missing its terminal
   * `result`. Counting user events against results would drift: background
   * task re-invocations produce results with no user event, and synthetic
   * supervisor results close crashed turns. Instead, look at the latest
   * turn-relevant event — turn content (the shared kind list from
   * `@/lib/research/turnActivity`, or the `system:init` that opens every
   * turn) with no `result` after it means the turn is dangling. Mirrors
   * `isTurnInFlight` on the client and the supervisor's busy state.
   */
  public async hasIncompleteTurn(conversationId: string): Promise<boolean> {
    const row = await this.getRawDb().oneOrNone<{ kind: string }>(`
      -- ResearchConversationEventsRepo.hasIncompleteTurn
      SELECT "kind"
      FROM "ResearchConversationEvents"
      WHERE "conversationId" = $(conversationId)
        AND (
          "kind" IN ($(turnActivityKinds:csv))
          OR "kind" = 'result'
          OR ("kind" = 'system' AND "payload"->>'subtype' = $(turnOpeningSubtype))
        )
      ORDER BY "seq" DESC
      LIMIT 1
    `, {
      conversationId,
      turnActivityKinds: [...TURN_ACTIVITY_EVENT_KINDS],
      turnOpeningSubtype: TURN_OPENING_SYSTEM_SUBTYPE,
    });
    return row !== null && row.kind !== "result";
  }

  /**
   * Batched `hasIncompleteTurn`: which of these conversations currently have
   * a dangling turn? One round-trip for the sidebar's status indicators —
   * the LATERAL subquery rides the `(conversationId, seq)` index per
   * conversation, same access path as the single-conversation variant.
   */
  public async conversationsWithIncompleteTurns(conversationIds: string[]): Promise<string[]> {
    if (conversationIds.length === 0) return [];
    const rows = await this.getRawDb().any<{ conversationId: string }>(`
      -- ResearchConversationEventsRepo.conversationsWithIncompleteTurns
      SELECT ids.id AS "conversationId"
      FROM unnest($(conversationIds)::text[]) AS ids(id)
      CROSS JOIN LATERAL (
        SELECT e."kind"
        FROM "ResearchConversationEvents" e
        WHERE e."conversationId" = ids.id
          AND (
            e."kind" IN ($(turnActivityKinds:csv))
            OR e."kind" = 'result'
            OR (e."kind" = 'system' AND e."payload"->>'subtype' = $(turnOpeningSubtype))
          )
        ORDER BY e."seq" DESC
        LIMIT 1
      ) last_event
      WHERE last_event."kind" <> 'result'
    `, {
      conversationIds,
      turnActivityKinds: [...TURN_ACTIVITY_EVENT_KINDS],
      turnOpeningSubtype: TURN_OPENING_SYSTEM_SUBTYPE,
    });
    return rows.map((r) => r.conversationId);
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
