/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod]
 *
 * If no environment is specified, you can use the environment variables PG_URL,
 * MONGO_URL and SETTINGS_FILE
 */
require("ts-node/register");
const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");
const { readFile } = require("fs").promises;

const initGlobals = (isProd) => {
  global.bundleIsServer = true;
  global.bundleIsTest = false;
  global.bundleIsProduction = isProd;
  global.bundleIsMigrations = true;
  global.defaultSiteAbsoluteUrl = "";
  global.serverPort = 5001;
  global.estrellaPid = -1;
}

const readUrlFile = async (fileName) =>
  (await readFile(`../ForumCredentials/${fileName}`)).toString().trim();

(async () => {
  let mode = process.argv[3];
  if (mode === "development") {
    mode = "dev";
  } else if (mode === "production") {
    mode = "prod";
  }

  const args = {
    mongoUrl: process.env.MONGO_URL,
    postgresUrl: process.env.PG_URL,
    settingsFileName: process.env.SETTINGS_FILE,
    shellMode: false,
  };

  if (["dev", "staging", "prod"].includes(mode)) {
    console.log('Running migrations in mode', mode);
    args.mongoUrl = await readUrlFile(`${mode}-db-conn.txt`);
    args.postgresUrl = await readUrlFile(`${mode}-pg-conn.txt`);
    args.settingsFileName = `../ForumCredentials/settings-${mode}.json`;
    process.argv = process.argv.slice(0, 3).concat(process.argv.slice(4));
  } else if (args.postgresUrl && args.mongoUrl && args.settingsFileName) {
    console.log('Using PG_URL, MONGO_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL, MONGO_URL and SETTINGS_FILE)');
  }

  initGlobals(mode === "prod");

  const { getInstanceSettings } = require("./packages/lesswrong/lib/executionEnvironment");
  getInstanceSettings(args); // These args will be cached for later

  const {initServer} = require("./packages/lesswrong/server/serverStartup");
  await initServer(args);

  let exitCode = 0;

  const db = await createSqlConnection(args.postgresUrl);
  try {
    await db.tx(async (transaction) => {
      const migrator = await createMigrator(transaction);
      const result = await migrator.runAsCLI();
      if (!result) {
        // If the migration throws an error it will have already been reported,
        // but we need to manually propagate it to the exitCode
        exitCode = 1;
      }
    });
  } catch (e) {
    console.error("An error occurred while running migrations:", e);
    exitCode = 1;
  }

  await db.$pool.end();
  process.exit(exitCode);
})();
