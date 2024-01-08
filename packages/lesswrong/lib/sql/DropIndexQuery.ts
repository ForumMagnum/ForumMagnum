import Query from "./Query";
import Table from "./Table";
import TableIndex from "./TableIndex";

/**
 * Builds a Postgres query that deletes a particular index. Be careful.
 */
class DropIndexQuery<T extends DbObject> extends Query<T> {
  constructor(table: Table<T>, index: string | TableIndex<T>) {
    super(table, [`DROP INDEX IF EXISTS "${typeof index === "string" ? index : index.getName()}"`]);
  }
}

export default DropIndexQuery;
