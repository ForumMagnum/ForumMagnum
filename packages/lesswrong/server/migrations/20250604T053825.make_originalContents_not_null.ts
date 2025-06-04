export const up = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "Revisions" ALTER COLUMN "originalContents" SET NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
}
