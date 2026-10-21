export const up = async ({db}: MigrationContext) => {
  await db.none(`CREATE INDEX IF NOT EXISTS idx_chapters_post_ids ON "Chapters" USING gin("postIds")`);
};

export const down = async ({db}: MigrationContext) => {
  await db.none(`DROP INDEX IF EXISTS idx_chapters_post_ids`);
};
