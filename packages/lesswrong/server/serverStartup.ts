import { MongoClient } from 'mongodb';
//import { Pool } from 'pg';
import pgPromise from 'pg-promise';
import { setDatabaseConnection, setPostgresConnection } from '../lib/mongoCollection';
import { onStartupFunctions, isAnyTest } from '../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { startWebserver } from './apolloServer';
import { initGraphQL } from './vulcan-lib/apollo-server/initGraphQL';
import { createVoteableUnionType } from './votingGraphQL';
import { Globals } from '../lib/vulcan-lib/config';
import process from 'process';
import readline from 'readline';
import chokidar from 'chokidar';
import fs from 'fs';

async function serverStartup() {
  // eslint-disable-next-line no-console
  console.log("Starting server");
  
  const isTTY = process.stdout.isTTY;
  const CSI = "\x1b[";
  const blue = isTTY ? `${CSI}34m` : "";
  const endBlue = isTTY ? `${CSI}39m` : "";
  
  wrapConsoleLogFunctions((log, ...message) => {
    process.stdout.write(`${blue}${new Date().toISOString()}:${endBlue} `);
    log(...message);
    
    // Uncomment to add stacktraces to every console.log, for debugging where
    // mysterious output came from.
    //var stack = new Error().stack
    //log(stack)
  });
  
  const commandLineArguments = getCommandLineArguments();
  
  try {
    // eslint-disable-next-line no-console
    console.log("Connecting to mongodb");
    const client = new MongoClient(commandLineArguments.mongoUrl, {
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
    return;
  }
  try {
    //const postgresClient = new Pool({ connectionString: commandLineArguments.postgresUrl });
    const postgresClient = pgPromise({
      // Initialization options from http://vitaly-t.github.io/pg-promise/module-pg-promise.html
    })(commandLineArguments.postgresUrl);
    
    setPostgresConnection(postgresClient);
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to postgres: ", err);
    process.exit(1);
    return;
  }
  
  // eslint-disable-next-line no-console
  console.log("Loading settings");
  await refreshSettingsCaches();
  
  require('../server.ts');
  
  // eslint-disable-next-line no-console
  console.log("Running onStartup functions");
  for (let startupFunction of onStartupFunctions)
    await startupFunction();
  
  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  
  if (commandLineArguments.shellMode) {
    initShell();
  } else {
    if (!isAnyTest) {
      watchForShellCommands();
      // eslint-disable-next-line no-console
      console.log("Starting webserver");
      startWebserver();
    }
  }
  
  /*if (process.stdout.isTTY) {
    console.log("Output is a TTY");
    initShell();
    
    const origConsoleLog = console.log;
    console.log = (message) => wrappedConsoleLog(origConsoleLog, message);
  }*/
}

function wrapConsoleLogFunctions(wrapper: (originalFn: any, ...message: any[])=>void) {
  for (let functionName of ["log", "info", "warn", "error", "trace"]) {
    // eslint-disable-next-line no-console
    const originalFn = console[functionName];
    // eslint-disable-next-line no-console
    console[functionName] = (...message: any[]) => {
      wrapper(originalFn, ...message);
    }
  }
}

function wrappedConsoleLog(unwrappedConsoleLog: (...messages: string[])=>void, message: string)
{
  const screenHeight = process.stdout.rows;
  const ESC = '\x1b';
  const CSI = ESC+'[';
  
  process.stdout.write(`${CSI}s`); // Save cursor
  process.stdout.write(`${CSI}1;${screenHeight-2}r`); // Set scroll region
  process.stdout.write(`${CSI}${screenHeight-2};1H`); // Move cursor to insertion point
  process.stdout.write(message+"\n"); // Write the output
  process.stdout.write(`${CSI}r`); // Clear scroll region
  process.stdout.write(`${CSI}u`); // Restore cursor
}

function initShell()
{
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
    fs.unlinkSync(path);
    try {
      const result = await eval(fileContents);
      // eslint-disable-next-line no-console
      console.log("Finished. Result: ", result);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Failed.");
      // eslint-disable-next-line no-console
      console.log(e);
    }
  });
}

void serverStartup();
