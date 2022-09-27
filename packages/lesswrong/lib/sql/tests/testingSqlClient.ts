import { Collections } from "../../vulcan-lib/getCollection";
import PgCollection from "../PgCollection";
import CreateTableQuery from "../CreateTableQuery";
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

const buildTables = async (client: SqlClient) => {
  for (const collection of Collections) {
    if (collection instanceof PgCollection) {
      if (!collection.table) {
        collection.buildPostgresTable();
      }

      const createTableQuery = new CreateTableQuery(collection.table);
      const {sql, args} = createTableQuery.compile();
      try {
        await client.unsafe(sql, args);
      } catch (e) {
        throw new Error(`Create table query failed: ${e.message}: ${sql}: ${inspect(args, {depth: null})}`);
      }

      const rawIndexes = expectedIndexes[collection.options.collectionName] ?? [];
      for (const index of rawIndexes) {
        const {key, ...options} = index;
        await collection._ensureIndex(key, options);
      }
    }
  }
}

const makeDbName = (id?: string) => {
  const date = new Date().toISOString().replace(/[:.-]/g,"_");
  id = id ?? `${date}_${process.pid}_${process.env.JEST_WORKER_ID}`;
  return `unittest_${id}`.toLowerCase();
}

export const createTestingSqlClient = async (id?: string, dropExisting?: boolean): Promise<SqlClient> => {
  const dbName = makeDbName(id);
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't initialize test DB - PG_URL not set");
  }
  let sql = await createSqlConnection(PG_URL);
  if (dropExisting) {
    await sql`DROP DATABASE IF EXISTS ${sql(dbName)}`;
  }
  await sql`CREATE DATABASE ${sql(dbName)}`;
  await closeSqlClient(sql);
  const testUrl = replaceDbNameInPgConnectionString(PG_URL, dbName);
  sql = await createSqlConnection(testUrl);
  setSqlClient(sql);
  await buildTables(sql);
  return sql;
}

export const dropTestingDatabases = async (olderThan?: string | Date) => {
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't drop testing databases - PG_URL not set");
  }
  const sql = await createSqlConnection(PG_URL);
  const databases = await sql`
    SELECT datname
    FROM pg_database
    WHERE datistemplate = FALSE AND
      datname LIKE 'unittest_%' AND
      pg_catalog.pg_get_userbyid(datdba) = CURRENT_USER
  `;
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
      await sql`DROP DATABASE ${sql(datname)}`;
    }
  }
}

export const killAllConnections = async (id?: string) => {
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't kill connections - PG_URL not set");
  }
  const sql = await createSqlConnection(PG_URL);
  const dbName = makeDbName(id);
  await sql`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${sql(dbName)}' AND pid <> pg_backend_pid()
  `;
  const client = getSqlClient();
  if (client) {
    await closeSqlClient(client);
  }
}
