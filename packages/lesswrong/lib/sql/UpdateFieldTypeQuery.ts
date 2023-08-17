import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to update the type for the given
 * field to the type specified in the schema. This currently assumes
 * that the old type is trivially castable to the new type.
 */
class UpdateFieldTypeQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, fieldName: string) {
    const fieldType = table.getFields()[fieldName];
    super(table, [
      "ALTER TABLE",
      table,
      `ALTER COLUMN "${fieldName}" TYPE ${fieldType.toConcrete().toString()}`,
    ]);
  }
}

export default UpdateFieldTypeQuery;
