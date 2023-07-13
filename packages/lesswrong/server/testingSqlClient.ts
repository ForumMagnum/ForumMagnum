import { Application, json, Request, Response } from "express";
import PgCollection from "../lib/sql/PgCollection";
import SwitchingCollection from "../lib/SwitchingCollection";
import CreateIndexQuery from "../lib/sql/CreateIndexQuery";
import CreateTableQuery from "../lib/sql/CreateTableQuery";
import { Collections } from "./vulcan-lib";
import { expectedIndexes } from "../lib/collectionIndexUtils";
import { ensurePostgresViewsExist } from "./postgresView";
import { ensureMongo2PgLockTableExists } from "../lib/mongo2PgLock";
import { closeSqlClient, getSqlClient, replaceDbNameInPgConnectionString, setSqlClient } from "../lib/sql/sqlClient";
import { createSqlConnection } from "./sqlConnection";
import { inspect } from "util";
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

export const preparePgTables = () => {
  for (let collection of Collections) {
    if (collection instanceof SwitchingCollection) {
      collection = collection.getPgCollection() as unknown as CollectionBase<any>;
    }
    if (collection instanceof PgCollection) {
      if (!collection.table) {
        collection.buildPostgresTable();
      }
    }
  }
}

const buildTables = async (client: SqlClient) => {
  await ensureMongo2PgLockTableExists(client);

  preparePgTables();

  for (let collection of Collections) {
    if (collection instanceof SwitchingCollection) {
      collection = collection.getPgCollection() as unknown as CollectionBase<any>;
    }
    if (collection instanceof PgCollection) {
      const {table} = collection;
      const createTableQuery = new CreateTableQuery(table);
      const {sql, args} = createTableQuery.compile();
      try {
        await client.any(sql, args);
      } catch (e) {
        throw new Error(`Create table query failed: ${e.message}: ${sql}: ${inspect(args, {depth: null})}`);
      }

      const rawIndexes = expectedIndexes[collection.options.collectionName] ?? [];
      for (const rawIndex of rawIndexes) {
        const {key, ...options} = rawIndex;
        const fields: MongoIndexKeyObj<any> = typeof key === "string" ? {[key]: 1} : key;
        const index = table.getIndex(Object.keys(fields), options) ?? table.addIndex(fields, options);
        const createIndexQuery = new CreateIndexQuery(table, index, true);
        const {sql, args} = createIndexQuery.compile();
        try {
          await client.any(sql, args);
        } catch (e) {
          throw new Error(`Create index query failed: ${e.message}: ${sql}: ${inspect(args, {depth: null})}`);
        }
      }
    }
  }

  await ensurePostgresViewsExist(client);
}

const makeDbName = (id?: string) => {
  const jestWorkerIdSuffix = process.env.JEST_WORKER_ID ? `_${process.env.JEST_WORKER_ID}` : "";
  id ??= `${new Date().toISOString().replace(/[:.-]/g, "_")}_${process.pid}${jestWorkerIdSuffix}`;
  return `unittest_${id}`.toLowerCase();
}

const createTemporaryConnection = async () => {
  let client = getSqlClient();
  if (client) {
    return client;
  }
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't initialize test DB - PG_URL not set");
  }
  client = await createSqlConnection(PG_URL, true);
  setSqlClient(client);
  return client;
}

export type TestingSqlClient = {
  sql: SqlClient,
  dbName: string,
}

export const createTestingSqlClient = async (
  id: string | undefined = undefined,
  dropExisting = false,
  setAsGlobalClient = true,
): Promise<TestingSqlClient> => {
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't create testing SQL client - PG_URL not set");
  }
  const dbName = makeDbName(id);
  // eslint-disable-next-line no-console
  console.log(`Creating test database '${dbName}'...`);
  let sql = await createTemporaryConnection();
  if (dropExisting) {
    await sql.none(`DROP DATABASE IF EXISTS ${dbName}`);
  }
  await sql.none(`CREATE DATABASE ${dbName}`);
  const testUrl = replaceDbNameInPgConnectionString(PG_URL, dbName);
  sql = await createSqlConnection(testUrl, true);
  await buildTables(sql);
  if (setAsGlobalClient) {
    setSqlClient(sql);
  }
  return {
    sql,
    dbName,
  };
}

export const createTestingSqlClientFromTemplate = async (template: string): Promise<TestingSqlClient> => {
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't create testing SQL client from template - PG_URL not set");
  }
  if (!template) {
    throw new Error("No template database provided");
  }
  const dbName = makeDbName();
  let sql = await createTemporaryConnection();
  await sql.any('CREATE DATABASE "$1:value" TEMPLATE $2', [dbName, template]);
  const testUrl = replaceDbNameInPgConnectionString(PG_URL, dbName);
  sql = await createSqlConnection(testUrl, true);
  setSqlClient(sql);
  return {
    sql,
    dbName,
  };
}

/**
 * Our approach to database cleanup is to just delete all the runs older than 1 day.
 * This allows us to inspect the databases created during the last run if necessary
 * for debugging whilst also making sure that we clean up after ourselves eventually
 * (assuming that the tests are run again some day).
 */
export const dropTestingDatabases = async (olderThan?: string | Date) => {
  const sql = await createTemporaryConnection();
  const databases = await sql.any(`
    SELECT datname
    FROM pg_database
    WHERE datistemplate = FALSE AND
      datname LIKE 'unittest_%' AND
      pg_catalog.pg_get_userbyid(datdba) = CURRENT_USER
  `);
  const secondsPerDay = 1000 * 60 * 60 * 24;
  olderThan = new Date(olderThan ?? Date.now() - secondsPerDay);
  for (const database of databases) {
    const {datname} = database;
    if (!datname.match(/^unittest_\d{4}_\d{2}_\d{2}t\d{2}_\d{2}_\d{2}_\d{3}z.*$/)) {
      continue;
    }

    // Replace underscores with dashes and colons etc
    const tokens = datname.split("_").slice(1, 7);
    const yearMonth = tokens.slice(0, 2);
    const dayTime = tokens.slice(2, 5);
    const millis = tokens[5];
    const dateString = (yearMonth.join("-") + "-" + dayTime.join(":") + "." + millis).toUpperCase();
    const dateCreated = new Date(dateString);
    if (dateCreated < olderThan) {
      await sql.none(`DROP DATABASE ${datname}`);
    }
  }
}

export const killAllConnections = async (id?: string) => {
  const sql = await createTemporaryConnection();
  const dbName = makeDbName(id);
  await sql.any(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = $1 AND pid <> pg_backend_pid()
  `, [dbName]);
  const client = getSqlClient();
  if (client) {
    await closeSqlClient(client);
  }
}

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
