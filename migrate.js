/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod] [lw]
 *
 * If no environment is specified, you can use the environment variables PG_URL,
 * MONGO_URL and SETTINGS_FILE
 * 
 * Runs for the EA Forum by default.  Add `lw` as the last argument to run for LW.  Requires that you provide an environment explicitly.
 */
require("ts-node/register");
const { getDatabaseConfig, startSshTunnel } = require("./scripts/startup/buildUtil");

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

const fetchImports = (args, isProd) => {
  initGlobals(args, isProd);

  const { getSqlClientOrThrow, setSqlClient } = require("./packages/lesswrong/lib/sql/sqlClient");
  const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
  return { getSqlClientOrThrow, setSqlClient, createSqlConnection };
}

const credentialsPath = (forum) => {
  const base = process.env.GITHUB_WORKSPACE ?? "..";
  const repoName = forum === 'lw' ? 'LessWrong-Credentials' : 'ForumCredentials';
  return `${base}/${repoName}`;
}

const credentialsFile = (fileName, forum) => {
  return `${credentialsPath(forum)}/${fileName}`;
}

const settingsFilePath = (fileName, forum) => {
  const base = process.env.GITHUB_WORKSPACE ?? "..";
  const repoName = forum === 'lw' ? 'LessWrong-Credentials' : 'ForumCredentials';
  return `${base}/${repoName}/${fileName}`;
}

const databaseConfig = (mode, forum) => getDatabaseConfig((forum === 'lw') ? {
  db: `${credentialsPath(forum)}/connectionConfigs/${mode}.json`,
} : {
  mongoUrlFile: `${credentialsPath(forum)}/${mode}-db-conn.txt`,
  postgresUrlFile: `${credentialsPath(forum)}/${mode}-pg-conn.txt`,
});

const settingsFileName = (mode, forum) => {
  if (forum === 'lw') {
    if (mode === 'prod') {
      return 'settings-production-lesswrong.json';
    }
    return 'settings-local-dev-devdb.json'
  }
  return `settings-${mode}.json`;
};

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
  } else if (!["up", "down", "pending", "executed"].includes(command)) {
    mode = "dev";
  }

  const forum = process.argv[4];
  const isLW = forum === 'lw';

  const args = {
    mongoUrl:  databaseConfig(mode, forum).mongoUrl,
    postgresUrl: databaseConfig(mode, forum).postgresUrl,
    settingsFileName: process.env.SETTINGS_FILE,
    shellMode: false,
  };
  process.env.MONGO_URL = args.mongoUrl;
  process.env.PG_URL = args.postgresUrl;
  
  await startSshTunnel(databaseConfig(mode, forum).sshTunnelCommand);

  if (["dev", "staging", "prod"].includes(mode)) {
    console.log('Running migrations in mode', mode);
    args.settingsFileName = settingsFilePath(settingsFileName(mode, forum), forum);
    if (command !== "create") {
      process.argv = process.argv.slice(0, 3).concat(process.argv.slice(isLW ? 5 : 4));
    } else if (isLW) {
      process.argv.pop();
    }
  } else if (args.postgresUrl && args.mongoUrl && args.settingsFileName) {
    console.log('Using PG_URL, MONGO_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL, MONGO_URL and SETTINGS_FILE)');
  }

  const { getSqlClientOrThrow, setSqlClient, createSqlConnection } = fetchImports(args, mode === "prod");

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
