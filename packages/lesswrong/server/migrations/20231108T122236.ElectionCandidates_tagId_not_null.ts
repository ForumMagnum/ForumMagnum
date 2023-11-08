import ElectionCandidates from "../../lib/collections/electionCandidates/collection";

export const acceptsSchemaHash = "ad4c1482bc5f8277eff9e3078a020a9a";

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
