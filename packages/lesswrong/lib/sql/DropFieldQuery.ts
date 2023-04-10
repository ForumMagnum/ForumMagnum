import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to drop a field from a Postgres table.
 * This asserts that the field exists in the schema, which should be
 * true in the case where:
 * - it's used in a reverse migration
 * - we are deleting an old field that has been deprecated for a while
 *
 * We may want to change this in the future if there are cases where we want to
 * drop a field that is not in the schema.
 */
class DropFieldQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, fieldName: string) {
    const fields = table.getFields();
    const fieldType = fields[fieldName];
    if (!fieldType) {
      throw new Error(`Field "${fieldName}" does not exist in the schema`);
    }
    super(table, [
      "ALTER TABLE",
      table,
      `DROP COLUMN IF EXISTS "${fieldName}" CASCADE`, // CASCADE: drop indexes and constraints that depend on this column
    ]);
  }
}

export default DropFieldQuery;
