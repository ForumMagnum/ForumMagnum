import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { onStartupFunctions, isAnyTest } from '../../../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { startWebserver } from './apolloServer';
import { initGraphQL } from '../../../server/vulcan-lib/apollo-server/initGraphQL';
import { createVoteableUnionType } from '../../../server/votingGraphQL';
import process from 'process';
import readline from 'readline';

async function serverStartup() {
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
  
  // eslint-disable-next-line no-console
  console.log("Loading settings");
  await refreshSettingsCaches();
  
  require('../../../server.js');
  
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
    const originalFn = console[functionName];
    console[functionName] = (...message: any[]) => {
      wrapper(originalFn, ...message);
    }
  }
}

function wrappedConsoleLog(unwrappedConsoleLog, message)
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
  
  repl.start({
    prompt: "> ",
    terminal: true,
    preview: true,
    breakEvalOnSigint: true,
    useGlobal: true,
  });
}

serverStartup();
