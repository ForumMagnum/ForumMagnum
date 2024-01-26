import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to drop the default value for the given
 * field.
 */
class DropDefaultValueQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, fieldName: string) {
    super(table, [
      "ALTER TABLE",
      table,
      `ALTER COLUMN "${fieldName}" DROP DEFAULT`,
    ]);
  }
}

export default DropDefaultValueQuery;
