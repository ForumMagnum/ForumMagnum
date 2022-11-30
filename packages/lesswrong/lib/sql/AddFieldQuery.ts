import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to add a new field to a Postgres table.
 * This assumes that the field already exists in the schema but
 * has not been propogated to the database yet and, as such, is
 * mainly meant for use in migrations.
 */
class AddFieldQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table, fieldName: string) {
    const fields = table.getFields();
    const field = fields[fieldName];
    if (!field) {
      throw new Error(`Field "${fieldName}" does not exist in the schema`);
    }
    super(table, [
      "ALTER TABLE",
      table,
      `ADD COLUMN "${fieldName}" ${field.toString()}`,
    ]);
  }
}

export default AddFieldQuery;
