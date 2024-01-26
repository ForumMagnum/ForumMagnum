import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to alter a table to be UNLOGGED (ie not use the Write-Ahead Log).
 * This is useful for tables that are only used for caching, and don't need to be backed up.
 */

class UnlogTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>) {
    super(table, [
      "ALTER TABLE",
      table,
      "SET UNLOGGED",
    ]);
  }
}

export default UnlogTableQuery;