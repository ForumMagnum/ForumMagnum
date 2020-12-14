import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { onStartupFunctions } from '../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { forumTypeSetting } from '../../../lib/instanceSettings';

const dbName = 'lesswrong2';

async function serverStartup() {
  console.log("Starting server");
  console.log(`forumType = ${forumTypeSetting.get()}`);
  
  const commandLineArguments = getCommandLineArguments();
  
  try {
    const client = new MongoClient(commandLineArguments.mongoUrl, {
      // See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html
      // for various options that could be tuned here
    });
    await client.connect();
    const db = client.db(dbName);
    setDatabaseConnection(client, db);
    
    const postCount = await db.collection("posts").count();
    console.log(`Database contains ${postCount} posts`);
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

serverStartup();
