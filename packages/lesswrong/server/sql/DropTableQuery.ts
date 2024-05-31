import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query that deletes a particular table. Be careful.
 */
class DropTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, ifExists = true) {
    super(table, [`DROP TABLE ${ifExists ? "IF EXISTS " : ""}"${table.getName()}"`]);
  }
}

export default DropTableQuery;
