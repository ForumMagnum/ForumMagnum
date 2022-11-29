/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|production]
 *
 * If no environment is specified, you can use the environment variable PG_URL
 */
require("ts-node/register");
const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");
const { readFile } = require("fs").promises;

(async () => {
  const mode = process.argv[3];
  let pgUrl = process.env["PG_URL"];
  if (["dev", "staging", "prod"].includes(mode)) {
    console.log('Running migrations in mode', mode);
    pgUrl = (await readFile(`../ForumCredentials/${mode}-pg-conn.txt`)).toString().trim();
    process.argv = process.argv.slice(0, 3).concat(process.argv.slice(4));
  } else if (pgUrl) {
    console.log('Using PG_URL from environment');
  } else {
    throw new Error('Unable to run migration without an environment mode or PG_URL');
  }

  const db = await createSqlConnection(pgUrl);
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
