import Query from "./Query";
import Table from "./Table";

class CreateTableQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table) {
    const fields = table.getFields();
    super(table, [
      "CREATE TABLE IF NOT EXISTS",
      table,
      `(_id ${fields["_id"].toString()} PRIMARY KEY`,
    ]);
    for (const field of Object.keys(fields).filter((field) => field !== "_id")) {
      this.atoms.push(`, "${field}" ${fields[field].toString()}`);
    }
    this.atoms.push(")");
  }
}

export default CreateTableQuery;
