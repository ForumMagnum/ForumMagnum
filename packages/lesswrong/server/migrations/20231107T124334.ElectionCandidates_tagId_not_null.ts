import ElectionCandidates from "../../lib/collections/electionCandidates/collection";

export const acceptsSchemaHash = "e1db749fcd83e8c45b1b0516537d982b";

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
