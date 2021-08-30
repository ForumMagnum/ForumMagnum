/// <reference types="cypress" />

const { MongoClient, ObjectId } = require('mongodb');
const { createHash } = require('crypto');
const testAdmin = require('../fixtures/testAdmin.json');
const testUser = require('../fixtures/testUser.json');
const seedPosts = require('../fixtures/posts.json');
const TEST_USER_LOGIN_TOKEN = "1234";
const TEST_ADMIN_LOGIN_TOKEN = "0123";

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
      MongoClient.connect("mongodb://localhost:27017", async function(err, client) {
        if(err) {
          console.error(err);
          return;
        }
        await client.db().dropDatabase();
      });
      return null;
    },
    async createUser({user, loginToken}) {
      MongoClient.connect("mongodb://localhost:27017", async function(err, client) {
        if(err) {
          console.error(err);
          return;
        }
        const db = await client.db();
        const insertedUser = await db.collection('users').insertOne(user);
        await db.collection('users').updateOne({_id: insertedUser.insertedId}, {
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
    createPost(title, body) {
      MongoClient.connect(process.env.MONGO_URL, function(err, client) {
        if(err) {
          console.log(err);
          return;
        }
        const db = client.db();
        db.collection('users').updateOne({username: testAdmin.username}, {
          $addToSet: {
            "services.resume.loginTokens": TEST_ADMIN_LOGIN_TOKEN,
          }
        });
        db.collection('users').updateOne({username: testUser.username}, {
        $addToSet: {
            "services.resume.loginTokens": TEST_USER_LOGIN_TOKEN,
          }
        });
      });
      return null;
    }
  });
};
