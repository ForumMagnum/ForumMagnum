import { Collections } from "../../vulcan-lib/getCollection";
import PgCollection from "../PgCollection";
import CreateTableQuery from "../CreateTableQuery";
import { createSqlConnection } from "../../../server/sqlConnection";
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
      const query = new CreateTableQuery(collection.table);
      const {sql, args} = query.compile();
      try {
        await client.unsafe(sql, args);
      } catch (e) {
        throw new Error(`Create table query failed: ${e.message}: ${sql}: ${inspect(args, {depth: null})}`);
      }
    }
  }
}


export const createTestingSqlClient = async (): Promise<SqlClient> => {
  const date = new Date().toISOString().replace(/[:.-]/g,"_");
  const dbName = `unittest_${date}_${process.pid}_${process.env.JEST_WORKER_ID}`.toLowerCase();
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't initalize test DB - PG_URL not set");
  }
  let sql = await createSqlConnection(PG_URL);
  await sql`CREATE DATABASE ${sql(dbName)}`;
  const testUrl = replaceDbNameInPgConnectionString(PG_URL, dbName);
  sql = await createSqlConnection(testUrl);
  await buildTables(sql);
  return sql;
}

export const dropTestingDatabases = async () => {
  const {PG_URL} = process.env;
  if (!PG_URL) {
    throw new Error("Can't initalize test DB - PG_URL not set");
  }
  const sql = await createSqlConnection(PG_URL);
  const databases = await sql`
    SELECT datname
    FROM pg_database
    WHERE datistemplate = FALSE AND
      datname LIKE 'unittest_%' AND
      pg_catalog.pg_get_userbyid(datdba) = CURRENT_USER
  `;
  const queries = databases.map(({datname}) => sql`DROP DATABASE ${sql(datname)}`);
  await Promise.all(queries);
}
