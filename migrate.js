require("ts-node/register");
const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");

(async () => {
  try {
    const db = await createSqlConnection();
    await db.tx(async (transaction) => {
      const migrator = await createMigrator(transaction);
      await migrator.runAsCLI();
    });
  } finally {
    // Call exit manually as the Postgres thread pool stalls the exit for ~10 seconds
    process.exit(1);
  }
})();
