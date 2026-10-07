/* eslint-disable no-console */
import * as fs from "fs";
import countBy from "lodash/countBy";
import Users from "@/server/collections/users/collection";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { waitForBackgroundTasks } from "@/server/utils/backgroundTask";
import { classifyLlmRejectedUser } from "@/server/llmRejectionTriage/classifier";
import { getLlmRejectionTriageInput, isEligibleForLlmRejectionTriage, runLlmRejectionTriage, type LlmRejectionTriageAction } from "@/server/llmRejectionTriage/triage";

/**
 * Backfill and backtest for the LLM-rejection triage classifier.
 *
 * Backfill the current review queue (dry run classifies only; pass true to act on verdicts):
 *   yarn repl dev lw packages/lesswrong/scripts/llmRejectionTriage.ts "backfillLlmRejectionTriage()"
 *   yarn repl dev lw packages/lesswrong/scripts/llmRejectionTriage.ts "backfillLlmRejectionTriage(true)"
 *
 * Classify specific users without acting on them:
 *   yarn repl dev lw packages/lesswrong/scripts/llmRejectionTriage.ts "classifyLlmRejectionTriageUsers(['userId1', 'userId2'])"
 *
 * Backtest against past moderator decisions on auto-rejected users (read-only):
 *   yarn repl dev lw packages/lesswrong/scripts/llmRejectionTriage.ts "backtestLlmRejectionTriage('/path/out.jsonl')"
 */

const CONCURRENCY = 8;

async function runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function backfillLlmRejectionTriage(apply = false) {
  const context = createAdminContext();
  const queueUsers = await Users.find({ needsReview: true }).fetch();
  const eligibleUsers: DbUser[] = [];
  for (const user of queueUsers) {
    if (await isEligibleForLlmRejectionTriage(user, context)) eligibleUsers.push(user);
  }
  console.log(`${eligibleUsers.length} of ${queueUsers.length} queue users are eligible${apply ? "" : " (dry run)"}`);

  const actions: Array<LlmRejectionTriageAction | "none"> = [];
  await runWithConcurrency(eligibleUsers, CONCURRENCY, async (user) => {
    const result = await runLlmRejectionTriage(user._id, context, { dryRun: !apply });
    actions.push(result?.action ?? "none");
    console.log(`${user.displayName} (${user._id}): ${result?.verdict.verdict ?? "no verdict"} -> ${result?.action ?? "no action"} - ${result?.verdict.reason ?? ""}`);
  });
  console.log(countBy(actions));
  // The repl exits when this resolves, which would drop updateUser's background callbacks.
  await waitForBackgroundTasks();
}

/** Classifies specific users regardless of eligibility, e.g. to recheck backtest cases after a prompt change. Read-only. */
export async function classifyLlmRejectionTriageUsers(userIds: string[]) {
  const context = createAdminContext();
  for (const userId of userIds) {
    const user = await Users.findOne({ _id: userId });
    if (!user) continue;
    const verdict = await classifyLlmRejectedUser(await getLlmRejectionTriageInput(user, context));
    console.log(`${user.displayName} (${userId}): ${verdict?.verdict ?? "no verdict"} - ${verdict?.reason ?? ""}`);
  }
}

type BacktestOutcome = "approved" | "snoozed" | "purged" | "banned" | "removed";

interface BacktestUser {
  userId: string;
  outcome: BacktestOutcome;
}

const AUTO_REJECTED_USERS_WITH_OUTCOMES_QUERY = `
  -- llmRejectionTriage.backtestPopulation
  WITH "autoRejected" AS (
    SELECT "userId", MAX("postedAt") AS "lastAutoRejectedAt" FROM (
      SELECT "userId", "postedAt" FROM "Posts"
      WHERE "rejected" IS TRUE AND "rejectedReason" LIKE '%This is an automated rejection%' AND "postedAt" > NOW() - make_interval(days => $(days))
      UNION ALL
      SELECT "userId", "postedAt" FROM "Comments"
      WHERE "rejected" IS TRUE AND "rejectedReason" LIKE '%This is an automated rejection%' AND "postedAt" > NOW() - make_interval(days => $(days))
    ) "items"
    GROUP BY "userId"
  ),
  "outcomes" AS (
    SELECT u."_id" AS "userId", CASE
      WHEN u."banned" > NOW() AND u."deleteContent" IS TRUE THEN 'purged'
      WHEN u."banned" > NOW() THEN 'banned'
      WHEN u."reviewedAt" > a."lastAutoRejectedAt" AND u."reviewedByUserId" IS NOT NULL AND u."snoozedUntilContentCount" IS NULL THEN 'approved'
      WHEN u."reviewedAt" > a."lastAutoRejectedAt" AND u."snoozedUntilContentCount" IS NOT NULL THEN 'snoozed'
      WHEN u."needsReview" IS NOT TRUE AND u."reviewedByUserId" IS NULL THEN 'removed'
    END AS "outcome"
    FROM "autoRejected" a
    JOIN "Users" u ON u."_id" = a."userId"
  )
  SELECT "userId", "outcome" FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY "outcome" ORDER BY random()) AS "rank"
    FROM "outcomes"
    WHERE "outcome" IS NOT NULL
  ) "ranked"
  WHERE "outcome" IN ('approved', 'snoozed') OR "rank" <= $(sampleSizePerOutcome)
`;

export async function backtestLlmRejectionTriage(outPath: string, days = 180, sampleSizePerOutcome = 35) {
  const db = getSqlClientOrThrow();
  const population = await db.any<BacktestUser>(AUTO_REJECTED_USERS_WITH_OUTCOMES_QUERY, { days, sampleSizePerOutcome });
  console.log("Population:", countBy(population, user => user.outcome));

  const context = createAdminContext();
  const out = fs.createWriteStream(outPath);
  const results: Array<{ outcome: BacktestOutcome, verdict: string }> = [];
  await runWithConcurrency(population, CONCURRENCY, async ({ userId, outcome }) => {
    const user = await Users.findOne({ _id: userId });
    if (!user) return;
    const input = await getLlmRejectionTriageInput(user, context);
    const verdict = await classifyLlmRejectedUser(input);
    results.push({ outcome, verdict: verdict?.verdict ?? "none" });
    out.write(JSON.stringify({
      userId,
      displayName: user.displayName,
      outcome,
      verdict: verdict?.verdict ?? null,
      reason: verdict?.reason ?? null,
      itemStatuses: countBy(input.items, item => item.status),
    }) + "\n");
    console.log(`${outcome} ${user.displayName}: ${verdict?.verdict ?? "no verdict"}`);
  });
  out.end();

  const byOutcome = countBy(results, result => `${result.outcome} -> ${result.verdict}`);
  console.log(Object.entries(byOutcome).sort().map(([key, count]) => `${key}: ${count}`).join("\n"));
}
