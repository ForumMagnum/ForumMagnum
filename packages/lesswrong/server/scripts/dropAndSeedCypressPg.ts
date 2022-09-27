import { Vulcan } from "../vulcan-lib";
import { createTestingSqlClient, killAllConnections } from "../../lib/sql/tests/testingSqlClient";
import Posts from "../../lib/collections/posts/collection";
import Comments from "../../lib/collections/comments/collection";
// TODO: Import data for these collections when they're migrated to postgres
// import Users from "../../lib/collections/users/collection";
// import Conversations from "../../lib/collections/conversations/collection";
// import Messages from "../../lib/collections/messages/collection";

import seedPosts from "../../../../cypress/fixtures/posts";
import seedComments from "../../../../cypress/fixtures/comments";
// import seedUsers from "../../../../cypress/fixtures/users";
// import seedConversations from "../../../../cypress/fixtures/conversations";
// import seedMessages from "../../../../cypress/fixtures/messages";

const importData = async <T extends {}>(collection: CollectionBase<any>, data: T[]) => {
  // eslint-disable-next-line no-console
  console.log(`Importing seed data for ${collection.options.collectionName}`);
  await collection.rawInsert(data);
}

Vulcan.dropAndSeedCypressPg = async () => {
  const id = "cypress_tests";
  // eslint-disable-next-line no-console
  console.log("Killing connections");
  await killAllConnections(id);
  // eslint-disable-next-line no-console
  console.log("Creating database");
  await createTestingSqlClient(id, true);
  await Promise.all([
    importData(Posts, seedPosts),
    importData(Comments, seedComments),
    // importData(Users, seedUsers),
    // importData(Conversations, seedConversations),
    // importData(Messages, seedMessages),
  ]);
}
