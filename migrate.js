/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod]
 *
 * If no environment is specified, you can use the environment variable PG_URL
 *
 * If migrations fail on deployment, check eb-hooks.log
 */
require("ts-node/register");

// TODO TMP: Hack to make sure we don't break LessWrong deploys before they
// migrate to Postgres - remove this once they migrate
const {ROOT_URL} = process.env;
if (ROOT_URL && !ROOT_URL.match(/effectivealtruism|eaforum/)) {
  console.log("Skipping migrations as ROOT_URL is not effectivealtruism");
  process.exit(0);
}

const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");
const { readFile } = require("fs").promises;

(async () => {
  let mode = process.argv[3];
  let pgUrl = process.env["PG_MIGRATIONS_URL"] ?? process.env["PG_URL"];
  if (["dev", "development", "staging", "prod", "production"].includes(mode)) {
    if (mode === "development") {
      mode = "dev";
    } else if (mode === "production") {
      mode = "prod";
    }

    console.log('Running migrations in mode', mode);
    pgUrl = (await readFile(`../ForumCredentials/${mode}-pg-conn.txt`)).toString().trim();
    process.argv = process.argv.slice(0, 3).concat(process.argv.slice(4));
  } else if (pgUrl) {
    console.log('Using Postgres connection string from environment');
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
