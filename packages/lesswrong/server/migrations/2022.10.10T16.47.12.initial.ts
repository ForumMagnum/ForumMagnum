export const up = async ({db}: MigrationContext) => {
  const result = await db.one("SELECT current_database() AS db");
  // eslint-disable-next-line no-console
  console.log("Using database:", result.db);
}
