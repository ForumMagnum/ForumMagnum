/* eslint-disable no-console */
import { getSqlClientOrThrow } from "../sql/sqlClient";

/**
 * One-off dev-DB reconciliation for the research-environments cutover.
 *
 * Run **manually, once, in a downtime window, AFTER** the committed migration
 * `20260520T000000.researchEnvironmentsCutover.ts` has run:
 *
 *   yarn repl dev lw packages/lesswrong/server/scripts/reconcileResearchEnvironmentsCutover.ts \
 *     'reconcileResearchEnvironmentsCutover()'
 *
 * The committed migration builds the final schema for fresh DBs/CI and creates
 * the genuinely-new `ResearchEnvironments` table on the existing dev DB. It
 * deliberately does **not** touch the columns/tables that already exist on dev —
 * those are this script's job. It operates only on tables that already exist on
 * the dev DB; transcripts (`ResearchConversations`/`ResearchConversationEvents`
 * rows) are altered in place, never dropped.
 *
 * This is a one-shot, not safely re-runnable across the step-6 table drop (steps
 * 1 and 4 read `WorkspaceRepos`/`UserSecrets`, which step 6 drops). The
 * individual ALTERs use IF EXISTS / IF NOT EXISTS so a re-run *before* step 6 is
 * harmless, but don't re-run after a partial failure past step 6 without
 * checking what already applied.
 */
export async function reconcileResearchEnvironmentsCutover(): Promise<void> {
  const db = getSqlClientOrThrow();

  // 1. ResearchConversations: add the new columns, set `runtime`, drop
  //    `workspaceRepoId`. Old `RepoInstallSnapshots` have the wrong filesystem
  //    layout and are abandoned, so there's nothing valid to point
  //    `baseEnvironmentId` at — leave it null (users re-establish environments
  //    once). A single LEFT-JOIN UPDATE gives *every* conversation a non-null
  //    runtime (repo runtime where one applied, else node24), so no row is left
  //    both-null and violating the exactly-one invariant.
  console.log("[reconcile] 1/8 ResearchConversations columns + runtime…");
  await db.none(`ALTER TABLE "ResearchConversations" ADD COLUMN IF NOT EXISTS "baseEnvironmentId" VARCHAR(27)`);
  await db.none(`ALTER TABLE "ResearchConversations" ADD COLUMN IF NOT EXISTS "runtime" TEXT`);
  await db.none(`
    UPDATE "ResearchConversations" rc
    SET "runtime" = COALESCE(wr."runtime", 'node24')
    FROM "ResearchConversations" self
    LEFT JOIN "WorkspaceRepos" wr ON self."workspaceRepoId" = wr."_id"
    WHERE rc."_id" = self."_id"
      AND rc."runtime" IS NULL
  `);
  await db.none(`ALTER TABLE "ResearchConversations" DROP COLUMN IF EXISTS "workspaceRepoId"`);

  // 2. Rewrite old user-event rows to Claude's stream-json shape so
  //    display/bootstrap/reminder code is new-shape-only, and give every
  //    remaining null-uuid row (a safe superset, not just user rows) a stable
  //    synthetic id before the route/repo start requiring non-null ids.
  console.log("[reconcile] 2/8 rewrite old user events + backfill null uuids…");
  await db.none(`
    UPDATE "ResearchConversationEvents"
    SET "payload" = jsonb_build_object(
      'type', 'user',
      'message', jsonb_build_object('role', 'user', 'content', "payload"->>'text')
    )
    WHERE "kind" = 'user'
      AND "payload" ? 'text'
      AND NOT ("payload" ? 'message')
  `);
  await db.none(`
    UPDATE "ResearchConversationEvents"
    SET "claudeMessageUuid" = 'legacy:' || "_id"
    WHERE "claudeMessageUuid" IS NULL
  `);

  // 3. Backfill `claudeSessionId` on old conversation rows from the first
  //    non-null `session_id` in their events (the field was captured
  //    async/first-write-wins, so some rows may be unset).
  console.log("[reconcile] 3/8 backfill claudeSessionId…");
  await db.none(`
    UPDATE "ResearchConversations" rc
    SET "claudeSessionId" = sub."sessionId"
    FROM (
      SELECT DISTINCT ON ("conversationId")
        "conversationId",
        "payload"->>'session_id' AS "sessionId"
      FROM "ResearchConversationEvents"
      WHERE "payload"->>'session_id' IS NOT NULL
      ORDER BY "conversationId", "seq" ASC
    ) sub
    WHERE rc."_id" = sub."conversationId"
      AND rc."claudeSessionId" IS NULL
  `);

  // 4. Users: copy the user-global Claude Code token into the new field. Same
  //    `research-token:v1:` ciphertext format, so no re-encryption.
  console.log("[reconcile] 4/8 copy Claude Code token into Users field…");
  await db.none(`
    UPDATE "Users" u
    SET "claudeCodeOAuthTokenEncrypted" = us."encryptedValue"
    FROM "UserSecrets" us
    WHERE us."userId" = u."_id"
      AND us."name" = 'CLAUDE_CODE_OAUTH_TOKEN'
      AND us."repoScope" IS NULL
      AND u."claudeCodeOAuthTokenEncrypted" IS NULL
  `);

  // 5. ResearchProjects: drop the removed defaultWorkspaceRepoId column.
  console.log("[reconcile] 5/8 drop ResearchProjects.defaultWorkspaceRepoId…");
  await db.none(`ALTER TABLE "ResearchProjects" DROP COLUMN IF EXISTS "defaultWorkspaceRepoId"`);

  // 6. Drop the removed tables (after steps 1 & 4, which read them).
  console.log("[reconcile] 6/8 drop WorkspaceRepos/RepoInstallSnapshots/UserSecrets…");
  await db.none(`DROP TABLE IF EXISTS "WorkspaceRepos"`);
  await db.none(`DROP TABLE IF EXISTS "RepoInstallSnapshots"`);
  await db.none(`DROP TABLE IF EXISTS "UserSecrets"`);

  // 7. Abandon the per-conversation Vercel sandboxes: their auto-snapshots have
  //    the wrong filesystem shape for the new layout. Clear the session rows so
  //    each conversation provisions fresh (overlaying current platform code and
  //    reconstructing its session from events) on its next turn. The Vercel
  //    sandboxes themselves must be deleted separately (see note below).
  console.log("[reconcile] 7/8 clear ResearchSandboxSessions…");
  await db.none(`DELETE FROM "ResearchSandboxSessions"`);

  // 8. Tighten `claudeMessageUuid` to NOT NULL and drop the leftover partial
  //    index. The committed migration's `updateIndexes` already added the new
  //    plain unique index (under its auto-generated name); `updateIndexes` never
  //    drops, so the old partial index from the deleted `createResearchTables`
  //    migration lingers until we drop it here. Safe now that step 2 backfilled
  //    every null id.
  console.log("[reconcile] 8/8 tighten claudeMessageUuid + drop old partial index…");
  await db.none(`ALTER TABLE "ResearchConversationEvents" ALTER COLUMN "claudeMessageUuid" SET NOT NULL`);
  await db.none(`DROP INDEX IF EXISTS "idx_ResearchConversationEvents_conversationId_claudeMessageUuid"`);

  console.log("[reconcile] DB reconciliation complete.");
  console.log(
    "[reconcile] REMAINING MANUAL STEP: delete the per-conversation Vercel sandboxes " +
      "named `research-*` (e.g. `cleanupOrphans.ts --all`, or the Vercel API), plus the " +
      "old RepoInstallSnapshots snapshots. The session rows are already cleared.",
  );
  // Note: the query-input `workspaceRepoId → baseEnvironmentId` rename is a pure
  // code rename with no back-compat read, so a stale `workspaceRepoId` attribute
  // in existing Yjs document state is inert. No Yjs data migration is run by
  // default; only if loading an old doc with a query-input node misbehaves would
  // a one-off Yjs-strip be needed.
}

export default reconcileResearchEnvironmentsCutover;
