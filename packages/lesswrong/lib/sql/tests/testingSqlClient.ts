import { Collections } from "../../vulcan-lib/getCollection";
import PgCollection from "../PgCollection";
import CreateTableQuery from "../CreateTableQuery";
import CreateIndexQuery from "../CreateIndexQuery";
import { createSqlConnection } from "../../../server/sqlConnection";
import { closeSqlClient, setSqlClient, getSqlClient } from "../sqlClient";
import { expectedIndexes } from "../../collectionIndexUtils";
import { inspect } from "util";

const replaceDbNameInPgConnectionString = (connectionString: string, dbName: string): string => {
  if (!/^postgres:\/\/.*\/[^/]+$/.test(connectionString)) {
    throw `Incorrectly formatted connection string or unrecognized connection string format: ${connectionString}`;
  }
  const lastSlash = connectionString.lastIndexOf('/');
  const withoutDbName = connectionString.slice(0, lastSlash);
  return `${withoutDbName}/${dbName}`;
}

export const preparePgTables = () => {
  for (const collection of Collections) {
    if (collection instanceof PgCollection) {
      if (!collection.table) {
        collection.buildPostgresTable();
      }
    }
  }
}

const buildTables = async (client: SqlClient) => {
  preparePgTables();

  for (const collection of Collections) {
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
        const fields = typeof key === "string" ? [key] : Object.keys(key);
        const index = table.getIndex(fields, options) ?? table.addIndex(fields, options);
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
}

const makeDbName = (id?: string) => {
  id = id ?? `${new Date().toISOString().replace(/[:.-]/g, "_")}_${process.pid}_${process.env.JEST_WORKER_ID}`;
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
  client = await createSqlConnection(PG_URL);
  setSqlClient(client);
  return client;
}

export const createTestingSqlClient = async (
  id: string | undefined = undefined,
  dropExisting = false,
  setAsGlobalClient = true,
): Promise<SqlClient> => {
  const dbName = makeDbName(id);
  let sql = await createTemporaryConnection();
  if (dropExisting) {
    await sql.none(`DROP DATABASE IF EXISTS ${dbName}`);
  }
  await sql.none(`CREATE DATABASE ${dbName}`);
  const testUrl = replaceDbNameInPgConnectionString(process.env.PG_URL!, dbName);
  sql = await createSqlConnection(testUrl);
  await buildTables(sql);
  if (setAsGlobalClient) {
    setSqlClient(sql);
  }
  return sql;
}

export const createTestingSqlClientFromTemplate = async (template: string): Promise<SqlClient> => {
  if (!template) {
    throw new Error("No template database provided");
  }
  const dbName = makeDbName();
  let sql = await createTemporaryConnection();
  await sql.any(`CREATE DATABASE ${dbName} TEMPLATE ${template}`);
  const testUrl = replaceDbNameInPgConnectionString(process.env.PG_URL!, dbName);
  sql = await createSqlConnection(testUrl);
  setSqlClient(sql);
  return sql;
}

export const dropTestingDatabases = async (olderThan?: string | Date) => {
  const sql = await createTemporaryConnection();
  const databases = await sql.any(`
    SELECT datname
    FROM pg_database
    WHERE datistemplate = FALSE AND
      datname LIKE 'unittest_%' AND
      pg_catalog.pg_get_userbyid(datdba) = CURRENT_USER
  `);
  olderThan = new Date(olderThan ?? Date.now());
  for (const database of databases) {
    const {datname} = database;
    const tokens = datname.split("_").slice(1, 7);
    const day = tokens.slice(0, 2);
    const time = tokens.slice(2, 5);
    const millis = tokens[5];
    const dateString = (day.join("-") + "-" + time.join(":") + "." + millis).toUpperCase();
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
