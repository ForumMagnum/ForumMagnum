import Query from "./Query";
import Table from "./Table";

export type SetLoggingTo = "LOGGED" | "UNLOGGED";

/**
 * Builds a Postgres query to alter a table to be LOGGED (ie to use the Write-Ahead Log).
 * This is the default, so this query is only useful for reverting a table to the default.
 */

class LogTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, setLoggingTo: SetLoggingTo) {
    super(table, [ "ALTER TABLE" ])
    this.atoms.push(table)
    this.atoms.push(`SET ${setLoggingTo}`)
  }
}

export default LogTableQuery;
