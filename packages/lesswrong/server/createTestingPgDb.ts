import { Application, json, Request, Response } from "express";
import { createTestingSqlClient, createTestingSqlClientFromTemplate } from "../lib/sql/tests/testingSqlClient";
import { createSqlConnection } from "./sqlConnection";
import { setSqlClient, getSqlClient } from "../lib/sql/sqlClient";
import { testServerSetting } from "../lib/instanceSettings";
import Posts from "../lib/collections/posts/collection";
import Comments from "../lib/collections/comments/collection";
import Conversations from "../lib/collections/conversations/collection";
import Messages from "../lib/collections/messages/collection";
import LocalGroups from "../lib/collections/localgroups/collection";
import Users from "../lib/collections/users/collection";

import seedPosts from "../../../cypress/fixtures/posts";
import seedComments from "../../../cypress/fixtures/comments";
import seedConversations from "../../../cypress/fixtures/conversations";
import seedMessages from "../../../cypress/fixtures/messages";
import seedLocalGroups from "../../../cypress/fixtures/localgroups";
import seedUsers from "../../../cypress/fixtures/users";

const seedData = async <T extends {}>(collection: CollectionBase<any>, data: T[]) => {
  // eslint-disable-next-line no-console
  console.log(`Importing Cypress seed data for ${collection.options.collectionName}`);
  await collection.rawInsert(data);
}

type DropAndCreatePgArgs = {
  seed?: boolean,
  templateId?: string,
  dropExisting?: boolean,
}

export const dropAndCreatePg = async ({seed, templateId, dropExisting}: DropAndCreatePgArgs) => {
  const oldClient = getSqlClient();
  setSqlClient(await createSqlConnection());
  await oldClient?.$pool.end();
  // eslint-disable-next-line no-console
  console.log("Creating PG database");
  await createTestingSqlClient(templateId, dropExisting);
  if (seed) {
    // eslint-disable-next-line no-console
    console.log("Seeding PG database");
    await Promise.all([
      seedData(Posts, seedPosts),
      seedData(Comments, seedComments),
      seedData(Conversations, seedConversations),
      seedData(Messages, seedMessages),
      seedData(LocalGroups, seedLocalGroups),
      seedData(Users, seedUsers),
    ]);
  }
}

// In development mode, we need a clean way to reseed the test database for Cypress.
// We definitely don't ever want this in prod though.
export const addCypressRoutes = (app: Application) => {
  // TODO: better check for dev mode
  if (testServerSetting.get()) {
    const cypressRoute = "/api/recreateCypressPgDb";
    app.use(cypressRoute, json({ limit: "1mb" }));
    app.post(cypressRoute, async (req: Request, res: Response) => {
      try {
        const { templateId } = req.body;
        if (!templateId || typeof templateId !== "string") {
          throw new Error("No templateId provided");
        }
        const {dbName} = await createTestingSqlClientFromTemplate(templateId)
        res.status(200).send({status: "ok", dbName});
      } catch (e) {
        res.status(500).send({status: "error", message: e.message});
      }
    });

    const integrationRoute = "/api/dropAndCreatePg";
    app.use(integrationRoute, json({ limit: "1mb" }));
    app.post(integrationRoute, async (req: Request, res: Response) => {
      try {
        const { templateId } = req.body;
        if (!templateId || typeof templateId !== "string") {
          throw new Error("No templateId provided");
        }
        await dropAndCreatePg({
          templateId,
          dropExisting: true,
          seed: false,
        });
        res.status(200).send({status: "ok"});
      } catch (e) {
        res.status(500).send({status: "error", message: e.message});
      }
    });
  }
}
