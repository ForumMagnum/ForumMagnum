/// <reference types="cypress" />

const { MongoClient, ObjectId } = require('mongodb');
const { createHash } = require('crypto');
const fs = require('fs');
const Bson = require('bson');

const testAdmin = require('../fixtures/testAdmin.json');
const testUser = require('../fixtures/testUser.json');

function hashLoginToken(loginToken) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

/**
 * Loads bson data for a list of documents (e.g. output by mongodump) into an array. 
 * Uses metadata file to determine the number of documents to load.
 * 
 * @param dataPath path to the bson data.
 * @param metadataPath path to the corresponding metadata.json file.
 * @returns an array of objects
 */
function loadBsonAsArray(dataPath, metadataPath) {
  const data = [];
  const documentCount = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')).indexes[0].v;
  (new Bson()).deserializeStream(fs.readFileSync(dataPath), 0, documentCount, data, 0);
  return data;
}

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('task', {
    async dropDatabase() {
      MongoClient.connect("mongodb://localhost:27017", async function(err, client) {
        if(err) {
          console.error(err);
          return;
        }
        await client.db().dropDatabase();
      });
      return null;
    },
    async seedDatabase() {
      const posts = loadBsonAsArray('./cypress/fixtures/posts/posts.bson', './cypress/fixtures/posts/posts.metadata.json');
      const comments = loadBsonAsArray('./cypress/fixtures/comments/comments.bson', './cypress/fixtures/comments/comments.metadata.json');
      MongoClient.connect("mongodb://localhost:27017", async function(err, client) {
        if(err) {
          console.error(err);
          return;
        }
        const db = await client.db();
        await db.collection('posts').insertMany(posts);
        await db.collection('comments').insertMany(comments);
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
