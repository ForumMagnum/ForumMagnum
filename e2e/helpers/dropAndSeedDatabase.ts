import { getMongoConnection } from "./mongoConnection";
import seedPosts from "../fixtures/posts";
import seedComments from "../fixtures/comments";
import seedUsers from "../fixtures/users";
import seedConversations from "../fixtures/conversations";
import seedMessages from "../fixtures/messages";
import seedLocalgroups from "../fixtures/localgroups";

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
 */
const dropAndSeedMongo = async () => {
  const dbConnection = await getMongoConnection();

  const db = dbConnection.db();
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
  // const result = await fetch("http://localhost:3000/api/dropAndCreatePg", {
    // method: "POST",
    // headers: {"Content-Type": "application/json"},
    // body: JSON.stringify({
      // seed: true,
      // templateId: "cypress_template",
      // dropExisting: true,
    // }),
  // });
  // const data = await result.json();
  // if (data.status === "error") {
    // throw new Error(data.message);
  // }
}

export const dropAndSeedDatabase = () => Promise.all([
  dropAndSeedMongo(),
  dropAndSeedPostgres(),
]);
