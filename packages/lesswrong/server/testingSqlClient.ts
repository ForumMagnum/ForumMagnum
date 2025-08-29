import { Application, json, Request, Response } from "express";
import { closeSqlClient, getSqlClient, replaceDbNameInPgConnectionString, setSqlClient } from "@/server/sql/sqlClient";
import { createSqlConnection } from "./sqlConnection";
import { testServerSetting } from "../lib/instanceSettings";
import { readFile } from "fs/promises";
import { sleep } from "@/lib/utils/asyncUtils";

const loadDbSchema = async (client: SqlClient) => {
  try {
    const schema = await readFile("./schema/accepted_schema.sql");
    await client.multi(schema.toString());
  } catch (e) {
    throw new Error("Failed to load db schema", {cause: e});
  }
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
  await loadDbSchema(sql);
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
  
  let retry = false;
  let retryCount = 0;
  do {
    try {
      retry = false;
      await sql.any('CREATE DATABASE "$1:value" TEMPLATE $2', [dbName, template]);
    } catch(e) {
      if (retryCount++ < 3 && /source database .* is being accessed by other users/.test(e.message)) {
        await sleep(1000);
        retry = true;
      }
    }
  } while (retry);

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
  olderThan = new Date(olderThan ?? (Date.now() - secondsPerDay));
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

type DropAndCreatePgArgs = {
  templateId?: string,
  dropExisting?: boolean,
}

// Exported to allow running with "yarn repl"
export const dropAndCreatePg = async ({templateId, dropExisting}: DropAndCreatePgArgs) => {
  // eslint-disable-next-line no-console
  console.log("Creating PG database");
  await createTestingSqlClient(templateId, dropExisting);
}

// In development mode, we need a clean way to recreate the integration test
// database. We definitely don't ever want this in prod though.
// TODO: There should be a much cleaner way to do this now we have a complete
// schema and dockerized postgres.
export const addTestingRoutes = (app: Application) => {
  // TODO: better check for dev mode
  if (testServerSetting.get()) {
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
        });
        res.status(200).send({status: "ok"});
      } catch (e) {
        res.status(500).send({status: "error", message: e.message});
      }
    });
  }
}
