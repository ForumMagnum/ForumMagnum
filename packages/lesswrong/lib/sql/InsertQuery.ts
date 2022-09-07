import Query from "./Query";
import Table from "./Table";

class InsertQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table, data: T, allowConflicts = false) {
    super(table, [`INSERT INTO "${table.getName()}"`]);
    this.appendValuesList(data);
    if (allowConflicts) {
      this.atoms.push("ON CONFLICT DO NOTHING");
    }
  }
}

export default InsertQuery;
