import ElectionCandidates from "../../lib/collections/electionCandidates/collection";

export const acceptsSchemaHash = "9993689a4229639120ef85f8531151ad";

export const up = async ({db}: MigrationContext) => {
  if (ElectionCandidates.isPostgres()) {
    await db.none(`
      ALTER TABLE "ElectionCandidates"
      ALTER COLUMN "tagId" SET NOT NULL
    `);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (ElectionCandidates.isPostgres()) {
    await db.none(`
      ALTER TABLE "ElectionCandidates"
      ALTER COLUMN "tagId" DROP NOT NULL
    `);
  }
}
