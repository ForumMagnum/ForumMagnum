import postgres from 'postgres';

declare global {
  type SqlClient = postgres.Sql<any>;
}

let sql: SqlClient | null = null;

export const setSqlConnection = (sql_: SqlClient) => sql = sql_;
export const getSqlClient = () => sql;
export const getSqlClientOrThrow = () => {
  if (!sql) {
    throw new Error("SQL Client is not initialized");
  }
  return sql;
}

export const createSqlConnection = async (url: string) => {
  const sql = postgres(url, {
    onnotice: () => {},
    // debug: console.log,
  });
  await sql`SET default_toast_compression = lz4`;
  await sql`CREATE EXTENSION IF NOT EXISTS "btree_gin"`;
  return sql;
}
