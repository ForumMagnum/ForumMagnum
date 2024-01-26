import Query from "./Query";
import Table from "./Table";

/**
 * Builds a Postgres query to create a new database table with the schema
 * defined by `table`. If the table already exists, setting `ifNotExists`
 * to true will prevent an error from being thrown.
 */
class CreateTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, ifNotExists = false) {
    const fields = table.getFields();
    super(table, [
      `CREATE${table.isWriteAheadLogged() ? "" : " UNLOGGED"} TABLE${ifNotExists ? " IF NOT EXISTS" : ""}`,
      table,
      `(_id ${fields["_id"].toString()} PRIMARY KEY`,
    ]);
    for (const field of Object.keys(fields).filter((fieldName) => fieldName !== "_id")) {
      this.atoms.push(`, "${field}" ${fields[field].toString()}`);
    }
    this.atoms.push(")");
  }
}

export default CreateTableQuery;
