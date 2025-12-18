import Users from "@/server/collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "${Users.tableName}"
    ADD COLUMN IF NOT EXISTS "lastDisplayNameChangeAt" TIMESTAMPTZ;
  `);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "${Users.tableName}"
    DROP COLUMN IF EXISTS "lastDisplayNameChangeAt";
  `);
}
