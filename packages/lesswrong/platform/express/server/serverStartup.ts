import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { onStartupFunctions } from '../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { forumTypeSetting } from '../../../lib/instanceSettings';
import process from 'process';

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
}

function wrapConsoleLogFunctions(wrapper: (originalFn: any, ...message: any[])=>void) {
  for (let functionName of ["log", "info", "warn", "error", "trace"]) {
    const originalFn = console[functionName];
    console[functionName] = (...message: any[]) => {
      wrapper(originalFn, ...message);
    }
  }
}

serverStartup();
