export const up = async ({db}: MigrationContext) => {
  await db.none(`DROP TABLE mongo2pg_lock`);
}
