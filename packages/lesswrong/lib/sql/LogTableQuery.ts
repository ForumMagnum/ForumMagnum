import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to alter a table to be LOGGED (ie to use the Write-Ahead Log).
 * This is the default, so this query is only useful for reverting a table to the default.
 */

class LogTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>) {
    super(table, [
      "ALTER TABLE",
      table,
      "SET LOGGED",
    ]);
  }
}

export default LogTableQuery;
