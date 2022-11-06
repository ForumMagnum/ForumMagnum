require("ts-node/register");
const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");

(async () => {
  const db = await createSqlConnection();
  try {
    await db.tx(async (transaction) => {
      const migrator = await createMigrator(transaction);
      await migrator.runAsCLI();
    });
  } catch (e) {
    console.error("An error occurred while running migrations:", e);
    process.exit(1);
  } finally {
    await db.$pool.end();
  }
})();
