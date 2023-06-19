/// <reference types="cypress" />

const pgp = require('pg-promise');
const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');

const pgDbTemplate = "unittest_cypress_template";
let pgDbName;

const pgPromiseLib = pgp();

function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

let dbConnection = null;
let pgConnection = null;

/**
 * Note:
 * There are 2 broad ways to connect MongoClient to a database:
 * 1. using a callback, e.g. MongoClient.connect(url, (err, dbConnection) => {...})
 * 2. using a promise, e.g. const dbConnection = await MongoClient.connect(url)
 *
 * For reasons I haven't pinned down, the callback version fails in the current
 * setup, despite previously working in a prior implementation that used an
 * in-memory DB. In particular, the associateLoginToken task fails to update
 * the document of the current user.
 *
 * Note that there are also instance method versions of both approaches above:
 * 1. (new MongoClient(url)).connect((err, dbConnection) => {...})
 * 2. const dbConnection = await (new MongoClient(url)).connect()
 * These show the same behavior: the callback version fails, and the promise version succeeds.
 *
 * @type {Cypress.PluginConfig}
 */
const dropAndSeedMongo = async (url) => {
  if (!dbConnection) {
    dbConnection = new MongoClient(url);
    await dbConnection.connect();
  }
  const isProd = (await dbConnection.db().collection('databasemetadata').findOne({name: 'publicSettings'}))?.value?.isProductionDB;
  if(isProd) {
    throw new Error('Cannot run tests on production DB.');
  }

  const db = dbConnection.db();

  await Promise.all((await db.collections()).map(collection => {
    if (collection.collectionName !== "databasemetadata") {
      return collection.deleteMany({});
    }
  }));
}

const dropAndSeedPostgres = async (PG_URL) => {
  if (!PG_URL) {
    console.warn("No PG_URL provided");
    return;
  }
  const result = await fetch("http://localhost:3000/api/recreateCypressPgDb", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      templateId: pgDbTemplate,
    }),
  });

  let data;
  try {
    data = await result.json();
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${await result.text()}`);
  }
  if (data.status === "error") {
    throw new Error(data.message);
  }
  pgDbName = data.dbName;
}

const replaceDbNameInPgConnectionString = (connectionString, dbName) => {
  if (!/^postgres:\/\/.*\/[^/]+$/.test(connectionString)) {
    throw `Incorrectly formatted connection string or unrecognized connection string format: ${connectionString}`;
  }
  const lastSlash = connectionString.lastIndexOf('/');
  const withoutDbName = connectionString.slice(0, lastSlash);
  return `${withoutDbName}/${dbName}`;
}

const associateLoginTokenMongo = async (config, {user, loginToken}) => {
  if (!dbConnection) {
    dbConnection = new MongoClient(config.env.TESTING_DB_URL);
    await dbConnection.connect();
  }
  const db = await dbConnection.db();
  await db.collection("users").updateOne({_id: user._id}, {
    $addToSet: {
      "services.resume.loginTokens": {
        when: new Date(),
        hashedToken: hashLoginToken(loginToken),
      },
    },
  });
}

const associateLoginTokenPostgres = async (config, {user, loginToken}) => {
  if (!config.env.PG_URL) {
    console.warn("No PG_URL provided");
    return;
  }
  const connectionString = replaceDbNameInPgConnectionString(
    config.env.PG_URL,
    pgDbName ?? pgDbTemplate,
  );
  pgConnection = pgPromiseLib({
    connectionString,
    max: 5,
  });
  const tokenData = {
    when: new Date(),
    hashedToken: hashLoginToken(loginToken),
  };
  await pgConnection.none(`
    UPDATE "Users"
    SET "services" = fm_add_to_set(
      "services",
      '{resume, loginTokens}'::TEXT[],
      $1::JSONB
    )
    WHERE _id = $2
  `, [tokenData, user._id]);
}

// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('task', {
    async dropAndSeedDatabase() {
      await Promise.all([
        dropAndSeedMongo(config.env.TESTING_DB_URL),
        dropAndSeedPostgres(config.env.PG_URL),
      ]);
      return null;
    },
    async associateLoginToken(data) {
      await Promise.all([
        associateLoginTokenMongo(config, data),
        associateLoginTokenPostgres(config, data),
      ]);
      return null;
    },
    log(data) {
      console.log(data);
      return null;
    }
  });
};
