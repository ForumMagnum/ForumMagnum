/// <reference types="cypress" />

const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');

const seedPosts = require('../fixtures/posts');
const seedComments = require('../fixtures/comments');
const seedUsers = require('../fixtures/users');
const seedConversations = require('../fixtures/conversations');
const seedMessages = require('../fixtures/messages');
const seedLocalgroups = require('../fixtures/localgroups');

function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

let dbConnection = null;

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

  await Promise.all([
    db.collection('comments').insertMany(seedComments),
    db.collection('users').insertMany(seedUsers),
    db.collection('conversations').insertMany(seedConversations),
    db.collection('posts').insertMany(seedPosts),
    db.collection('messages').insertMany(seedMessages),
    db.collection('localgroups').insertMany(seedLocalgroups),
  ]);
}

const dropAndSeedPostgres = async () => {
  console.log('drop and seed postgres, cypress side, before fetch')
  const result = await fetch("http://localhost:3000/api/dropAndCreatePg", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      seed: true,
      templateId: "cypress_template",
      dropExisting: true,
    }),
  });
  console.log('result has come back, back in client', result)

  let data;
  try {
    data = await result.json();
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${await result.text()}`);
  }
  if (data.status !== "ok") {
    throw new Error(data.message);
  }
}

// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('task', {
    async dropAndSeedDatabase() {
      console.log('task entry')
      await Promise.all([
        dropAndSeedMongo(config.env.TESTING_DB_URL),
        dropAndSeedPostgres(),
      ]);
      return null;
    },
    async associateLoginToken({user, loginToken}) {
      if (!dbConnection) {
        dbConnection = new MongoClient(config.env.TESTING_DB_URL);
        await dbConnection.connect();
      }
      const db = await dbConnection.db();
      await db.collection('users').updateOne({_id: user._id}, {
        $addToSet: {
          "services.resume.loginTokens": {
            when: new Date(),
            hashedToken: hashLoginToken(loginToken),
          },
        },
      });
      return null;
    },
  });
};
