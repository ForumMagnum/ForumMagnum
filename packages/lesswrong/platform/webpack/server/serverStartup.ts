import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { onStartupFunctions } from '../lib/executionEnvironment';
import { refreshSettingsCaches } from './loadDatabaseSettings';

const mongoConnectionString = 'mongodb://localhost:27017';

const dbName = 'lesswrong2';

console.log("In serverStartup");

const createFiber = (fn: ()=>Promise<T>):T => {
  return fn.future();
}

async function serverStartup() {
  console.log("Starting server");
  
  try {
    const client = new MongoClient(mongoConnectionString, {
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
    startupFunction();
}
serverStartup();
