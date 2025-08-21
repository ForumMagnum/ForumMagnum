import { createSqlConnection } from "../sqlConnection";
import type { DbTarget } from "./PgCollection";
import { isProduction } from "@/lib/executionEnvironment";

// logAllQueries: If true, generate a console log for all postgres queries.
// Intended for debugging and performance investigation, not for prod.
export const logAllQueries = process.env.QUERY_LOGGING === 'true';

// logQueryArguments: If true, logged queries will include the parameters to
// the query (which may include sensitive data). Intended for debugging, not for
// prod.
export const logQueryArguments = false;

// measureSqlBytesDownloaded: If true, logged queries will include the size (in
// bytes) of the result set.
export const measureSqlBytesDownloaded = !isProduction;

/** Main sql client which is safe to use for all queries */
let sql: SqlClient | null = null;
/** Client to use for read operations only.
 *  Currently used in the EA Forum bot environment to decrease load on the main database
 */
let sqlRead: SqlClient | null = null;
/**
 * A sql client which can be assumed to be outside a transaction, to allow running queries that require
 * this (such as CREATE INDEX CONCURRENTLY ...)
 */
let sqlOutsideTransaction: SqlClient | null = null;

export const setSqlClient = (sql_: SqlClient, target: DbTarget = "write", connectionString?: string) => {
  if (target === "noTransaction") {
    sqlOutsideTransaction = sql_;
    return;
  }

  connectionString ??= sql_.$pool?.options.connectionString as string;
  if (globalThis['pgClients']?.[connectionString]) {
    globalThis['pgClients'][connectionString] = sql_;
  } else {
    globalThis['pgClients'][connectionString] = sql_;
  }
}

export const getSqlClient = (target: DbTarget = "write") => {
  if (target === "noTransaction") {
    if (!sqlOutsideTransaction) {
      throw new Error("No sqlOutsideTransaction client set");
    }
    return sqlOutsideTransaction;
  }

  const url = target === "read"
    ? (process.env.PG_READ_URL ?? '')
    : (process.env.PG_URL ?? '');

  return createSqlConnection(url, false);
}

export const getSqlClientOrThrow = (target: DbTarget = "write") => {
  return getSqlClient(target);
}


// Note: this is only used in tests so doesn't need to handle the read/write distinction
export const closeSqlClient = async (client: SqlClient) => {
  if (client === sql) {
    sql = null;
  }
  await client.$pool.end();
}

export const runSqlQuery = async (query: string, args?: any, target: DbTarget = "write") => {
  const client = getSqlClientOrThrow(target);
  return client.any(query, args, () => `${query}: ${JSON.stringify(args)}`);
}

export const replaceDbNameInPgConnectionString = (connectionString: string, dbName: string): string => {
  if (!/^postgres:\/\/.*\/[^/]+$/.test(connectionString)) {
    throw `Incorrectly formatted connection string or unrecognized connection string format: ${connectionString}`;
  }
  const lastSlash = connectionString.lastIndexOf('/');
  const withoutDbName = connectionString.slice(0, lastSlash);
  return `${withoutDbName}/${dbName}`;
}
