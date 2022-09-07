import Query from "./Query";
import Table from "./Table";
import TableIndex from "./TableIndex";

class DropIndexQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table, index: string | TableIndex) {
    super(table, [`DROP INDEX "${typeof index === "string" ? index : index.getName()}"`]);
  }
}

export default DropIndexQuery;
