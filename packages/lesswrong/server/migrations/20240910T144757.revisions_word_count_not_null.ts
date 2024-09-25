export const acceptsSchemaHash = "8c84a413224b6139788e7a51da3bc113";

export const up = async ({db}: MigrationContext) => {
  await db.none('ALTER TABLE "Revisions" ALTER COLUMN "wordCount" SET NOT NULL');
}

export const down = async ({db}: MigrationContext) => {
  await db.none('ALTER TABLE "Revisions" ALTER COLUMN "wordCount" DROP NOT NULL');
}
