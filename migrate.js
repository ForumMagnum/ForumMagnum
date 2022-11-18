/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod|production]
 *
 * If no environment is specified, you can use the environment variable PG_URL
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
  let mode = process.argv[3] ?? process.env["NODE_ENV"];
  let pgUrl = process.env["PG_URL"];
  if (["dev", "staging", "prod", "production"].includes(mode)) {
    if (mode === "production") {
      mode = "prod";
    }
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
