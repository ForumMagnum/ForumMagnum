/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod]
 *
 * If no environment is specified, you can use the environment variables PG_URL,
 * MONGO_URL and SETTINGS_FILE
 */
require("ts-node/register");
const { getSqlClientOrThrow, setSqlClient } = require("./packages/lesswrong/lib/sql/sqlClient");
const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
const { readFile } = require("fs").promises;

const initGlobals = (args, isProd) => {
  global.bundleIsServer = true;
  global.bundleIsTest = false;
  global.bundleIsProduction = isProd;
  global.bundleIsMigrations = true;
  global.defaultSiteAbsoluteUrl = "";
  global.serverPort = 5001;
  global.estrellaPid = -1;

  const { getInstanceSettings } = require("./packages/lesswrong/lib/executionEnvironment");
  getInstanceSettings(args); // These args will be cached for later
}

const credentialsFile = (fileName) => {
  const base = process.env.GITHUB_WORKSPACE ?? "..";
  return `${base}/ForumCredentials/${fileName}`;
}

const readUrlFile = async (fileName) => (await readFile(credentialsFile(fileName))).toString().trim();

(async () => {
  const command = process.argv[2];
  if (["dev", "development", "staging", "production", "prod"].includes(command)) {
    console.error("Please specify the command before the mode");
    process.exit(1);
  }
  const isRunCommand = ["up", "down"].includes(command);

  let mode = process.argv[3];
  if (mode === "development") {
    mode = "dev";
  } else if (mode === "production") {
    mode = "prod";
  } else if (!isRunCommand) {
    mode = "dev";
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
    args.settingsFileName = credentialsFile(`settings-${mode}.json`);
    if (command !== "create") {
      process.argv = process.argv.slice(0, 3).concat(process.argv.slice(4));
    }
  } else if (args.postgresUrl && args.mongoUrl && args.settingsFileName) {
    console.log('Using PG_URL, MONGO_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL, MONGO_URL and SETTINGS_FILE)');
  }

  initGlobals(args, mode === "prod");

  if (isRunCommand) {
    const {initServer} = require("./packages/lesswrong/server/serverStartup");
    await initServer(args);
  }

  let exitCode = 0;

  const db = isRunCommand
    ? getSqlClientOrThrow()
    : await createSqlConnection(args.postgresUrl);

  try {
    await db.tx(async (transaction) => {
      setSqlClient(transaction);
      const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");
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
