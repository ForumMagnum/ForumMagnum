export const up = async ({db}: MigrationContext) => {
  await db.none(`DROP TABLE IF EXISTS mongo2pg_lock`);
}
