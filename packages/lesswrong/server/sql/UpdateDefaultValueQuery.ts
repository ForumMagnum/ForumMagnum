import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to update the default value for the given
 * field to the value specified in the schema. This currently assumes
 * that the old type is trivially castable to the new type.
 */
class UpdateDefaultValueQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, fieldName: string) {
    const fields = table.getFields();
    if (!fields[fieldName]) {
      throw new Error(`Table does not have field ${fieldName}`)
    }
    const defaultValue = fields[fieldName].getDefaultValueString();
    super(table, [
      "ALTER TABLE",
      table,
      `ALTER COLUMN "${fieldName}"`,
      defaultValue ? `SET DEFAULT ${defaultValue}` : "DROP DEFAULT",
    ]);
  }
}

export default UpdateDefaultValueQuery;
