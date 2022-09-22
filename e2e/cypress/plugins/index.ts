/// <reference types="cypress" />

import webpack from "@cypress/webpack-preprocessor";
import mongodb from "mongodb";
import type { MongoClient } from "mongodb";
import { createHash } from "crypto";

import seedPosts from "../fixtures/posts";
import seedComments from "../fixtures/comments";
import seedUsers from "../fixtures/users";
import seedConversations from "../fixtures/conversations";
import seedMessages from "../fixtures/messages";

function hashLoginToken(loginToken: string) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

let dbConnection: MongoClient | null = null;

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
 * 2. const dbConnection = await (new Mongoclient(url)).connect()
 * These show the same behavior: the callback version fails, and the promise version succeeds.
 */
// eslint-disable-next-line no-unused-vars
export const addCypressTasks = (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  on('file:preprocessor', webpack({
    webpackOptions: {
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
      },
    },
    watchOptions: {},
  }));

  on('task', {
    async dropAndSeedDatabase() {
      if (!dbConnection) {
        dbConnection = new mongodb.MongoClient(config.env.TESTING_DB_URL);
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
      ]);
      return null;
    },
    async associateLoginToken({user, loginToken}: {
      user: {_id: string},
      loginToken: string,
    }) {
      if (!dbConnection) {
        dbConnection = new mongodb.MongoClient(config.env.TESTING_DB_URL);
        await dbConnection.connect();
      }
      const db = dbConnection.db();
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
