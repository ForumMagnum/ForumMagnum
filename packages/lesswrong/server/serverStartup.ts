import './datadog/tracer';
import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { createSqlConnection } from './sqlConnection';
import { getSqlClientOrThrow, setSqlClient } from '../lib/sql/sqlClient';
import PgCollection from '../lib/sql/PgCollection';
import SwitchingCollection from '../lib/SwitchingCollection';
import { Collections } from '../lib/vulcan-lib/getCollection';
import { runStartupFunctions, isAnyTest, isMigrations } from '../lib/executionEnvironment';
import { forumTypeSetting, isEAForum } from "../lib/instanceSettings";
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments, CommandLineArguments } from './commandLine';
import { startWebserver } from './apolloServer';
import { initGraphQL } from './vulcan-lib/apollo-server/initGraphQL';
import { createVoteableUnionType } from './votingGraphQL';
import { Globals, Vulcan } from '../lib/vulcan-lib/config';
import { getBranchDbName } from "./branchDb";
import { replaceDbNameInPgConnectionString } from "../lib/sql/tests/testingSqlClient";
import { dropAndCreatePg } from './createTestingPgDb';
import process from 'process';
import chokidar from 'chokidar';
import fs from 'fs';
import { basename, join } from 'path';
import { ensureMongo2PgLockTableExists } from '../lib/mongo2PgLock';
import { filterConsoleLogSpam, wrapConsoleLogFunctions } from '../lib/consoleFilters';
import { ensurePostgresViewsExist } from './postgresView';

// Do this here to avoid a dependency cycle
Globals.dropAndCreatePg = dropAndCreatePg;

const initConsole = () => {
  const isTTY = process.stdout.isTTY;
  const CSI = "\x1b[";
  const blue = isTTY ? `${CSI}34m` : "";
  const endBlue = isTTY ? `${CSI}39m` : "";

  filterConsoleLogSpam();
  wrapConsoleLogFunctions((log, ...message) => {
    process.stdout.write(`${blue}${new Date().toISOString()}:${endBlue} `);
    log(...message);

    // Uncomment to add stacktraces to every console.log, for debugging where
    // mysterious output came from.
    //var stack = new Error().stack
    //log(stack)
  });
}

const connectToMongo = async (connectionString: string) => {
  if (isEAForum) {
    return;
  }
  try {
    // eslint-disable-next-line no-console
    console.log("Connecting to mongodb");
    const client = new MongoClient(connectionString, {
      // See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html
      // for various options that could be tuned here

      // A deprecation warning says to use this option 
      useUnifiedTopology: true,
    });
    await client.connect();
    const db = client.db();
    setDatabaseConnection(client, db);
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to mongodb: ", err);
    process.exit(1);
  }
}

const connectToPostgres = async (connectionString: string) => {
  try {
    if (connectionString) {
      const branchDb = await getBranchDbName();
      if (branchDb) {
        connectionString = replaceDbNameInPgConnectionString(connectionString, branchDb);
      }
      const dbName = /.*\/(.*)/.exec(connectionString)?.[1];
      // eslint-disable-next-line no-console
      console.log(`Connecting to postgres (${dbName})`);
      const sql = await createSqlConnection(connectionString);
      setSqlClient(sql);
    }
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to postgres: ", err.message);
    // TODO: Remove forum gating here when we expand Postgres usage
    if (forumTypeSetting.get() === "EAForum") {
      process.exit(1);
    }
  }
}

const initDatabases = ({mongoUrl, postgresUrl}: CommandLineArguments) =>
  Promise.all([
    connectToMongo(mongoUrl),
    connectToPostgres(postgresUrl),
  ]);

const initSettings = () => {
  // eslint-disable-next-line no-console
  console.log("Loading settings");
  return refreshSettingsCaches();
}

const initPostgres = async () => {
  if (Collections.some(collection => collection instanceof PgCollection || collection instanceof SwitchingCollection)) {
    await ensureMongo2PgLockTableExists(getSqlClientOrThrow());

    // eslint-disable-next-line no-console
    console.log("Building postgres tables");
    for (const collection of Collections) {
      if (collection instanceof PgCollection || collection instanceof SwitchingCollection) {
        collection.buildPostgresTable();
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log("Initializing switching collections from lock table");
  const polls: Promise<void>[] = [];
  for (const collection of Collections) {
    if (collection instanceof SwitchingCollection) {
      polls.push(collection.startPolling());
    }
  }
  await Promise.all(polls);

  try {
    await ensurePostgresViewsExist(getSqlClientOrThrow());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure Postgres views exist:", e);
  }
}

const executeServerWithArgs = async ({shellMode, command}: CommandLineArguments) => {
  // eslint-disable-next-line no-console
  console.log("Running onStartup functions");
  await runStartupFunctions();

  // define executableSchema
  createVoteableUnionType();
  initGraphQL();

  if (shellMode) {
    initShell();
  } else if (command) {
    const func = compileWithGlobals(command);
    const result = await func();
    // eslint-disable-next-line no-console
    console.log("Finished. Result: ", result);
    process.kill(estrellaPid, 'SIGQUIT');
  } else if (!isAnyTest && !isMigrations) {
    watchForShellCommands();
    // eslint-disable-next-line no-console
    console.log("Starting webserver");
    startWebserver();
  }
}

export const initServer = async (commandLineArguments?: CommandLineArguments) => {
  initConsole();
  const args = commandLineArguments ?? getCommandLineArguments();
  await initDatabases(args);
  await initSettings();
  require('../server.ts');
  await initPostgres();
  return args;
}

export const serverStartup = async () => {
  // eslint-disable-next-line no-console
  console.log("Starting server");
  const commandLineArguments = await initServer();
  await executeServerWithArgs(commandLineArguments);
}

function initShell() {
  const repl = require('repl');
  /*const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
  rl.on('line', line => {
    console.log(`Got input: ${line}`);
    rl.prompt();
  });
  rl.prompt();*/

  const r = repl.start({
    prompt: "> ",
    terminal: true,
    preview: true,
    breakEvalOnSigint: true,
    useGlobal: true,
  });
  r.context.Globals = Globals;
  r.context.Vulcan = Globals;
}

const compileWithGlobals = (code: string) => {
  // This is basically just eval() but done in a way that:
  //   1) Allows us to define our own global scope
  //   2) Doesn't upset esbuild
  const callable = (async function () {}).constructor(`with(this) { await ${code} }`);
  const scope = {Globals, Vulcan};
  return () => {
    return callable.call(new Proxy({}, {
      has () { return true; },
      get (_target, key) {
        if (typeof key !== "symbol") {
          return global[key as keyof Global] ?? scope[key as "Globals"|"Vulcan"];
        }
      }
    }));
  }
}

// Monitor ./tmp/pendingShellCommands for shell commands. If a JS file is
// written there, run it then delete it. Security-wise this is okay because
// write-access inside the repo directory is already equivalent to script
// execution.
const watchForShellCommands = () => {
  const watcher = chokidar.watch('./tmp/pendingShellCommands');
  watcher.on('add', async (path) => {
    const fileContents = fs.readFileSync(path, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Running shell command: ${fileContents}`);
    const newPath = join("tmp/runningShellCommands", basename(path));
    fs.renameSync(path, newPath);
    try {
      const func = compileWithGlobals(fileContents);
      const result = await func();
      // eslint-disable-next-line no-console
      console.log("Finished. Result: ", result);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Failed.");
      // eslint-disable-next-line no-console
      console.log(e);
    } finally {
      fs.unlinkSync(newPath);
    }
  });
}
