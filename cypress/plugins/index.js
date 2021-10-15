/// <reference types="cypress" />

const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');

const seedPosts = require('../fixtures/posts/index.js');
const seedComments = require('../fixtures/comments/index.js');
const seedUsers = require('../fixtures/users/index.js');
const seedConversations = require('../fixtures/conversations/index.js');
const seedMessages = require('../fixtures/messages/index.js');

function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

/**
 * Note: 
 * There are 2 broad ways to connect MongoClient to a database:
 * 1. using a callback, e.g. MongoClient.connect(url, (err, client) => {...})
 * 2. using a promise, e.g. const client = await MongoClient.connect(url)
 * 
 * For reasons I haven't pinned down, the callback version fails in the current
 * setup, despite previously working in a prior implementation that used an
 * in-memory DB. In particular, the associateLoginToken task fails to update
 * the document of the current user.
 * 
 * Note that there are also instance method versions of both approaches above:
 * 1. (new MongoClient(url)).connect((err, client) => {...})
 * 2. const client = await (new Mongoclient(url)).connect()
 * These show the same behavior: the callback version fails, and the promise version succeeds.
 * 
 * 
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('task', {
    async dropAndSeedDatabase() {
      const now = new Date();
      const postsWithDates = seedPosts
        .map(post => ({...post, 
          createdAt: now,
          postedAt: now,
          modifiedAt: now,
          frontpageDate: now,
        }));
      const commentsWithDates = seedComments
        .map(post => ({...post, 
          createdAt: now,
          postedAt: now,
          lastSubthreadActivity: now,
        }));
      const messagesWithDates = seedMessages
        .map(message => ({...message, 
          createdAt: now,
          contents: {
            ...message.contents,
            editedAt: now
          },
        }));
      const conversationsWithDates = seedConversations
        .map(conversation => ({...conversation, 
          createdAt: now,
          latestActivity: now,
        }));
      const client = new MongoClient(config.env.TESTING_DB_URL);
      try{
        await client.connect();
        const isProd = (await client.db().collection('databasemetadata').findOne({name: 'publicSettings'}))?.value?.isProductionDB;
        if(isProd) {
          throw new Error('Cannot run tests on production DB.');
        }

        const db = await client.db();

        await Promise.all((await db.collections()).map(collection => {
          if(collection.collectionName  !== "databasemetadata") {
            return db.collection(collection.collectionName).drop();
          }
        }));

        await Promise.all([
          db.collection('comments').insertMany(commentsWithDates),
          db.collection('users').insertMany(seedUsers),
          db.collection('conversations').insertMany(conversationsWithDates),
          db.collection('posts').insertMany(postsWithDates),
          db.collection('messages').insertMany(messagesWithDates),
        ]);
      } finally {
        await client.close();
      }
      return null;
    },
    async associateLoginToken({user, loginToken}) {
      const client = new MongoClient(config.env.TESTING_DB_URL);
      try{
        await client.connect();
        const db = await client.db();
        await db.collection('users').updateOne({_id: user._id}, {
          $addToSet: {
            "services.resume.loginTokens": {
              when: new Date(),
              hashedToken: hashLoginToken(loginToken),
            },
          },
        });
      } finally {
        await client.close();
      }
      return null;
    },
  });
};
