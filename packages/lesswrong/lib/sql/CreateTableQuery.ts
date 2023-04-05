import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to create a new database table with the schema
 * defined by `table`. If the table already exists, setting `ifNotExists`
 * to true will prevent an error from being thrown.
 *
 * Most queries don't care at all about whitespace, but this makes some
 * attempt at being readable for the sake of generating schemas.
 */
class CreateTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table, ifNotExists = false) {
    const fields = table.getFields();
    super(table, [
      `CREATE TABLE${ifNotExists ? " IF NOT EXISTS" : ""}`,
      table,
      `(\n  "_id" ${fields["_id"].toString()} PRIMARY KEY`,
    ]);
    const fieldNames = Object.keys(fields).filter((fieldName) => fieldName !== "_id");
    for (const field of fieldNames) {
      this.atoms.push(`,\n  "${field}" ${fields[field].toString()}`);
    }
    this.atoms.push("\n)");
  }
}

export default CreateTableQuery;
