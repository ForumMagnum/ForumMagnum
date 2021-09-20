/// <reference types="cypress" />

const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');

const seedPosts = require('../fixtures/posts/index.js');
const seedComments = require('../fixtures/comments/index.js');
const seedUsers = require('../fixtures/users/index.js');

function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

/**
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
      MongoClient.connect("mongodb://localhost:27017", async function(err, client) {
        if(err) {
          console.error(err);
          return;
        }
        const isProd = (await client.db().collection('databasemetadata').findOne({name: 'publicSettings'}))?.value?.isProductionDB;
        if(isProd) {
          throw new Error('Cannot run tests on production DB.');
        }
        await client.db().dropDatabase();
        const db = await client.db();
        await db.collection('posts').insertMany(postsWithDates);
        await db.collection('comments').insertMany(commentsWithDates);
        await db.collection('users').insertMany(seedUsers);
      });
      return null;
    },
    async associateLoginToken({user, loginToken}) {
      MongoClient.connect("mongodb://localhost:27017", async function(err, client) {
        if(err) {
          console.error(err);
          return;
        }
        const db = await client.db();
        await db.collection('users').updateOne({username: user.username}, {
          $addToSet: {
            "services.resume.loginTokens": {
              when: new Date(),
              hashedToken: hashLoginToken(loginToken),
            },
          }
        });
      });
      return null;
    },
  });
};
