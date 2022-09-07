import Query, { Atom } from "./Query";
import Table from "./Table";

class InsertQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    data: T,
    options: MongoInsertOptions<T> = {}, // TODO: What can options be?
    allowConflicts = false,
  ) {
    super(table, [`INSERT INTO "${table.getName()}"`]);
    this.appendValuesList(data);
    if (allowConflicts) {
      this.atoms.push("ON CONFLICT DO NOTHING");
    }
  }

  private appendValuesList(data: T): void {
    const fields = this.table.getFields();
    const keys = Object.keys(fields);
    this.atoms.push("(");
    let prefix = "";
    for (const key of keys) {
      this.atoms.push(`${prefix}"${key}"`);
      prefix = ", ";
    }
    this.atoms.push(") VALUES (");
    prefix = "";
    for (const key of keys) {
      this.atoms.push(prefix);
      this.atoms.push(this.createArg(data[key] ?? null));
      prefix = ", ";
    }
    this.atoms.push(")");
  }
}

export default InsertQuery;
