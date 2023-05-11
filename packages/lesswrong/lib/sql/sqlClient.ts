import { logIfSlow } from "../../lib/sql/PgCollection";

let sql: SqlClient | null = null;

export const setSqlClient = (sql_: SqlClient) => sql = sql_;

export const getSqlClient = () => sql;

export const getSqlClientOrThrow = () => {
  if (!sql) {
    throw new Error("SQL Client is not initialized");
  }
  return sql;
}

export const closeSqlClient = async (client: SqlClient) => {
  if (client === sql) {
    sql = null;
  }
  await client.$pool.end();
}

export const runSqlQuery = async (query: string, args?: any) => {
  const client = getSqlClientOrThrow();
  return await logIfSlow(
    () => client.any(query, args),
    () => `${query}: ${JSON.stringify(args)}`
  );
}
