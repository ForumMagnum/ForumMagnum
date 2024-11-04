import Query from "./Query";
import Table from "./Table";
import { Type } from "./Type";

/**
 * Builds a Postgres query to add a new field to a Postgres table.
 * This assumes that the field already exists in the schema but
 * has not been propogated to the database yet and, as such, is
 * meant for use in migrations.
 */
class AddFieldQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, fieldName: string, forceType?: Type) {
    const fieldType = forceType ?? table.getFields()[fieldName];
    if (!fieldType) {
      throw new Error(`Field "${fieldName}" does not exist in the schema`);
    }
    super(table, [
      "ALTER TABLE",
      table,
      `ADD COLUMN IF NOT EXISTS "${fieldName}" ${fieldType.toString()}`,
    ]);
  }
}

export default AddFieldQuery;
