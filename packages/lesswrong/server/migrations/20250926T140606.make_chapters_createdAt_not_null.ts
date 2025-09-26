export const up = async ({db}: MigrationContext) => {
  const result = await db.one<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'Chapters'
        AND column_name = 'createdAt'
        AND is_nullable = 'YES'
    ) AS exists;
  `);
  if (!result.exists) {
    console.log(`"Chapters.createdAt" is already NOT NULL. Skipping migration.`);
    return;
  }

  // Fill missing createdAt dates from the relevant sequence
  await db.none(`
    UPDATE "Chapters" c
    SET "createdAt" = COALESCE(s."createdAt", TIMESTAMP '1970-01-01 00:00:00')
    FROM "Sequences" s
    WHERE c."createdAt" IS NULL
      AND c."sequenceId" = s."_id"
  `);

  // Set the date to the unix epoch if the sequence is missing
  await db.none(`
    UPDATE "Chapters" c
    SET "createdAt" = TIMESTAMP '1970-01-01 00:00:00'
    WHERE c."createdAt" IS NULL
  `);

  // Make the field non-nullable
  await db.none(`
    ALTER TABLE "Chapters"
    ALTER COLUMN "createdAt" SET NOT NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "Chapters"
    ALTER COLUMN "createdAt" DROP NOT NULL
  `);
}
