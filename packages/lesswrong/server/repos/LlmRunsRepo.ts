import LlmRuns from "@/server/collections/llmRuns/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import InsertQuery from "@/server/sql/InsertQuery";
import type { ITask } from "pg-promise";

class LlmRunsRepo extends AbstractRepo<"LlmRuns"> {
  constructor() {
    super(LlmRuns);
  }

  /**
   * Atomically claim a run for an attempt: either it hasn't started, or its
   * previous attempt claimed it before `staleClaimBefore` and must have died.
   * Returns null if the run is finished, is being worked on, or has used up
   * its attempts.
   */
  claimRun(runId: string, staleClaimBefore: Date, maxAttempts: number): Promise<DbLlmRun | null> {
    return this.oneOrNone(`
      -- LlmRunsRepo.claimRun
      UPDATE "LlmRuns"
      SET "status" = 'running', "claimedAt" = NOW(), "attemptCount" = "attemptCount" + 1
      WHERE "_id" = $(runId)
      AND "attemptCount" < $(maxAttempts)
      AND (
        "status" = 'pending'
        OR ("status" = 'running' AND "claimedAt" < $(staleClaimBefore))
      )
      RETURNING *
    `, { runId, staleClaimBefore, maxAttempts });
  }

  async countRunsTriggeredByUserSince(userId: string, since: Date): Promise<number> {
    return countRunsTriggeredByUserSince(this.getRawDb(), userId, since);
  }

  async createRunForUser(run: InsertionRecord<DbLlmRun>, userId: string, limit: number | null, since: Date): Promise<string | null> {
    return this.getRawDb().tx(async (tx) => {
      await tx.one('SELECT "_id" FROM "Users" WHERE "_id" = $(userId) FOR UPDATE', { userId });
      if (limit !== null && await countRunsTriggeredByUserSince(tx, userId, since) >= limit) {
        return null;
      }
      const { sql, args } = new InsertQuery(this.collection.getTable(), run, {}, { returnInserted: true }).compile();
      const inserted = await tx.one<DbLlmRun>(sql, args);
      return inserted._id;
    });
  }
}

async function countRunsTriggeredByUserSince(db: SqlClient | ITask<{}>, userId: string, since: Date): Promise<number> {
  const { count } = await db.one<{ count: number }>(`
    -- LlmRunsRepo.countRunsTriggeredByUserSince
    SELECT COUNT(*)::INTEGER AS "count"
    FROM "LlmRuns" r
    JOIN "Comments" c ON c."_id" = r."triggerCommentId"
    WHERE c."userId" = $(userId)
    AND r."createdAt" > $(since)
  `, { userId, since });
  return count;
}

recordPerfMetrics(LlmRunsRepo);

export default LlmRunsRepo;
