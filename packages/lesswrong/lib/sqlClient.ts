import type {Sql} from 'postgres';

declare global {
  type SqlClient = Sql<any>;
}

let sql: SqlClient | null = null;

export const setSqlConnection = (_sql) => sql = _sql;
export const getSqlClient = () => sql;
export const getSqlClientOrThrow = () => {
  if (!sql) {
    throw new Error("SQL Client is not initialized");
  }
  return sql;
}
