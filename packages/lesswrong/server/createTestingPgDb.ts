import { isDevelopment } from "../lib/executionEnvironment";
import { Application, json, Request, Response } from "express";
import { createTestingSqlClient } from "../lib/sql/tests/testingSqlClient";
import { createSqlConnection } from "./sqlConnection";
import { setSqlClient, getSqlClient } from "../lib/sql/sqlClient";
import Posts from "../lib/collections/posts/collection";
import Comments from "../lib/collections/comments/collection";
// TODO: Import data for these collections when they're migrated to postgres
// import Users from "../lib/collections/users/collection";
// import Conversations from "../lib/collections/conversations/collection";
// import Messages from "../lib/collections/messages/collection";
// import LocalGroups from "../lib/collections/localgroups/collection";

import seedPosts from "../../../cypress/fixtures/posts";
import seedComments from "../../../cypress/fixtures/comments";
// import seedUsers from "../../../cypress/fixtures/users";
// import seedConversations from "../../../cypress/fixtures/conversations";
// import seedMessages from "../../../cypress/fixtures/messages";
// import seedLocalGroups from "../../../cypress/fixtures/localgroups";

const importData = async <T extends {}>(collection: CollectionBase<any>, data: T[]) => {
  // eslint-disable-next-line no-console
  console.log(`Importing Cypress seed data for ${collection.options.collectionName}`);
  await collection.rawInsert(data);
}

const dropAndCreatePg = async ({ seed, templateId}: {seed?: boolean, templateId?: string}) => {
  const oldClient = getSqlClient();
  setSqlClient(await createSqlConnection());
  await oldClient?.$pool.end();
  // eslint-disable-next-line no-console
  console.log("Creating PG database");
  await createTestingSqlClient(templateId, true);
  if (seed) {
    // eslint-disable-next-line no-console
    console.log("Seeding PG database");
    await Promise.all([
      importData(Posts, seedPosts),
      importData(Comments, seedComments),
      // importData(Users, seedUsers),
      // importData(Conversations, seedConversations),
      // importData(Messages, seedMessages),
      // importData(LocalGroups, seedLocalGroups),
    ]);
  }
}

// In development mode, we need a clean way to reseed the test database for Cypress.
// We definitely don't ever want this in prod though.
export const addCypressRoutes = (app: Application) => {
  if (isDevelopment) {
    const route = "/api/dropAndCreatePg"
    app.use(route, json({ limit: "1mb" }));
    app.post(route, async (req: Request, res: Response) => {
      try {
        const { seed, templateId } = req.body
        if (typeof seed !== 'boolean' || !templateId) {
          throw new Error(`Missing seed or templateId ${JSON.stringify(req.body)}`);
        }
        await dropAndCreatePg({ seed: seed, templateId });
        res.status(200).send({status: "ok"});
      } catch (e) {
        res.status(500).send({status: "error", message: e.message});
      }
    });
  }
}
