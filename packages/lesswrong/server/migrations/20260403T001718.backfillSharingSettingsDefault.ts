export const up = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "Posts"
    ALTER COLUMN "sharingSettings"
    SET DEFAULT '{"anyoneWithLinkCan":"none","explicitlySharedUsersCan":"comment"}'::jsonb
  `);

  await db.none(`
    UPDATE "Posts"
    SET "sharingSettings" = '{"anyoneWithLinkCan":"none","explicitlySharedUsersCan":"comment"}'::jsonb
    WHERE "sharingSettings" IS NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "Posts" ALTER COLUMN "sharingSettings" DROP DEFAULT`);
}
