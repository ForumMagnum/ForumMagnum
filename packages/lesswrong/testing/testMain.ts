import '../server';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { runStartupFunctions } from '../lib/executionEnvironment';
import { setServerSettingsCache, setPublicSettings } from '../lib/settingsCache';
import { MongoClient } from 'mongodb';
import { setDatabaseConnection, closeDatabaseConnection, setPostgresConnection } from '../lib/mongoCollection';
import { waitUntilCallbacksFinished } from '../lib/vulcan-lib/callbacks';
import process from 'process';
import { initGraphQL } from '../server/vulcan-lib/apollo-server/initGraphQL';
import { createVoteableUnionType } from '../server/votingGraphQL';
import { getAllCollections } from '../lib/vulcan-lib/getCollection';
import pgPromise from 'pg-promise';



// Work around an incompatibility between Jest and iconv-lite (which is used
// by mathjax).
require('iconv-lite').encodingExists('UTF-8')
require('encoding/node_modules/iconv-lite').encodingExists('UTF-8')


let mongodbConnected = false;
async function ensureMongodbConnection() {
  if (mongodbConnected)
    return;
  
  try {
    const connectionString = process.env.MONGO_URL as string; //Provided by @shelf/jest-mongodb
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
    console.log("Failed to connect to mongodb: ", err);
    return;
  }
  
  mongodbConnected = true;
}

let postgresdbConnected = false;
let testDbName: string|null = null;
async function ensurePostgresConnection() {
  if (postgresdbConnected)
    return;
  
  try {
    // Connect to postgres
    const postgresUrl = process.env.PG_TEST_URL as string;
    const pgPromiseLib = pgPromise({});
    const postgresClient = pgPromiseLib(postgresUrl);
    
    // Create a new DB to test in
    const date = new Date().toISOString().replace(/[:.-]/g,"_");
    testDbName = `unittest_${date}_${process.pid}`;
    await postgresClient.none('CREATE DATABASE $1:name', [testDbName]);
    await pgPromiseLib.end();
    
    // Open a new connection, with the unit test DB selected
    const unitTestConnectionString = replaceDbNameInPgConnectionString(postgresUrl, testDbName);
    let unitTestPostgresClient = pgPromise({})(unitTestConnectionString);
    setPostgresConnection(unitTestPostgresClient);
    
    // Initialize the unit test DB by creating an empty table for each collection
    await initializePgDatabase(unitTestPostgresClient);
  } catch(err) {
    // eslint-disable-next-line no-console
    console.log(`Failed to connect to postgres: ${err}`);
    return;
  }
  
  postgresdbConnected = true;
}

function replaceDbNameInPgConnectionString(connectionString: string, dbName: string): string {
  if (!/^postgres:\/\/.*\/[^/]+$/.test(connectionString))
    throw `Incorrectly formatted connection string or unrecognized connection string format: ${connectionString}`;
  let lastSlash = connectionString.lastIndexOf('/');
  let withoutDbName = connectionString.substr(0, lastSlash);
  return `${withoutDbName}/${dbName}`;
}

async function initializePgDatabase(client): Promise<void> {
  for (let collection of getAllCollections()) {
    if (collection.tableName) {
      await createPgTable(client, collection.tableName);
    }
  }
}

export async function createPgTable(client, tableName: string): Promise<void> {
  await client.any(`CREATE TABLE IF NOT EXISTS ${tableName} (
    id varchar(24) NOT NULL PRIMARY KEY,
    json jsonb NOT NULL
  )`, []);
}

async function deleteUnitTestDatabase(): Promise<void> {
  if (!testDbName) {
    // eslint-disable-next-line no-console
    console.error("Aborting (no unit test DB to delete)");
    return;
  }
  if (!testDbName.startsWith("unittest")) {
    throw 'Refusing to delete unit-test DB with database name that doesn\'t start with "unittest",';
  }
  
  const postgresUrl = process.env.PG_TEST_URL as string;
  const pgPromiseLib = pgPromise({});
  await pgPromiseLib.end();
  const postgresClient = pgPromiseLib(postgresUrl);
  
  try {
    await postgresClient.none('DROP DATABASE $1:name', testDbName);
    await pgPromiseLib.end();
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(`Unit test DB cleanup failed: ${e}`);
  }
  testDbName = null;
  await pgPromiseLib.end();
}

let setupRun = false;
async function oneTimeSetup() {
  if (setupRun) return;
  
  setServerSettingsCache({});
  setPublicSettings({});
  
  await ensureMongodbConnection();
  await ensurePostgresConnection();
  await runStartupFunctions();
  
  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  
  setupRun = true;
}

export function testStartup() {
  chai.should();
  chai.use(chaiAsPromised);
  
  beforeAll(async () => {
    await oneTimeSetup();
  });
  afterEach(async () => {
    await waitUntilCallbacksFinished();
  });
  afterAll(async () => {
    await closeDatabaseConnection();
    await deleteUnitTestDatabase();
  });
}
