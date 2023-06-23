import { Collections } from "../../vulcan-lib/getCollection";
import PgCollection from "../PgCollection";
import CreateTableQuery from "../CreateTableQuery";
import CreateIndexQuery from "../CreateIndexQuery";
import { createSqlConnection } from "../../../server/sqlConnection";
import { closeSqlClient, setSqlClient, getSqlClient } from "../sqlClient";
import { expectedIndexes } from "../../collectionIndexUtils";
import { inspect } from "util";
import SwitchingCollection from "../../SwitchingCollection";
import { ensureMongo2PgLockTableExists } from "../../mongo2PgLock";
import { ensurePostgresViewsExist } from "../../../server/postgresView";

export const replaceDbNameInPgConnectionString = (connectionString: string, dbName: string): string => {
  if (!/^postgres:\/\/.*\/[^/]+$/.test(connectionString)) {
    throw `Incorrectly formatted connection string or unrecognized connection string format: ${connectionString}`;
  }
  const lastSlash = connectionString.lastIndexOf('/');
  const withoutDbName = connectionString.slice(0, lastSlash);
  return `${withoutDbName}/${dbName}`;
}

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
