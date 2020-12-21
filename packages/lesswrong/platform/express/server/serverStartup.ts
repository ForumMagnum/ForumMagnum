import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { onStartupFunctions } from '../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { forumTypeSetting } from '../../../lib/instanceSettings';
import process from 'process';
import readline from 'readline';

const dbName = 'lesswrong2';

async function serverStartup() {
  console.log("Starting server");
  
  const isTTY = process.stdout.isTTY;
  const CSI = "\x1b[";
  const blue = isTTY ? `${CSI}34m` : "";
  const endBlue = isTTY ? `${CSI}39m` : "";
  
  wrapConsoleLogFunctions((log, ...message) => {
    process.stdout.write(`${blue}${new Date().toISOString()}:${endBlue} `);
    log(...message);
  });
  
  const commandLineArguments = getCommandLineArguments();
  
  try {
    const client = new MongoClient(commandLineArguments.mongoUrl, {
      // See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html
      // for various options that could be tuned here
    });
    await client.connect();
    const db = client.db(dbName);
    setDatabaseConnection(client, db);
  } catch(err) {
    console.log("Failed to connect to mongodb");
    console.log(err);
    return;
  }
  
  console.log("Loading settings");
  await refreshSettingsCaches();
  
  console.log("Importing everything");
  require('../../../server.js');
  
  console.log("Running onStartup functions");
  for (let startupFunction of onStartupFunctions)
    await startupFunction();
  
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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
  rl.on('line', line => {
    console.log(`Got input: ${line}`);
    rl.prompt();
  });
  rl.prompt();
}

serverStartup();
