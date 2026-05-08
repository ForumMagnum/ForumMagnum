/**
 * The original `20260506T191819.createResearchTables` migration was checked
 * in without `userId`/`projectId` on `ResearchConversationEvents` and then
 * edited in-place when those columns were added to the schema. Databases that
 * had run the original migration are stuck without the columns (because
 * `createTable` is `IF NOT EXISTS`), so this follow-up adds them, backfills
 * from `ResearchConversations`, and tightens to NOT NULL.
 */
export const up = async ({ db }: MigrationContext) => {
  await db.none(`
    ALTER TABLE "ResearchConversationEvents"
      ADD COLUMN IF NOT EXISTS "userId" VARCHAR(27),
      ADD COLUMN IF NOT EXISTS "projectId" VARCHAR(27)
  `);

  await db.none(`
    UPDATE "ResearchConversationEvents" e
    SET "userId" = c."userId",
        "projectId" = c."projectId"
    FROM "ResearchConversations" c
    WHERE c."_id" = e."conversationId"
      AND (e."userId" IS NULL OR e."projectId" IS NULL)
  `);

  await db.none(`
    ALTER TABLE "ResearchConversationEvents"
      ALTER COLUMN "userId" SET NOT NULL,
      ALTER COLUMN "projectId" SET NOT NULL
  `);
};

export const down = async ({ db }: MigrationContext) => {
  await db.none(`
    ALTER TABLE "ResearchConversationEvents"
      DROP COLUMN IF EXISTS "userId",
      DROP COLUMN IF EXISTS "projectId"
  `);
};
