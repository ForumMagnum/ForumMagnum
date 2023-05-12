import SelectQuery from "../../lib/sql/SelectQuery";
import Table from "../../lib/sql/Table";
import { getCollectionByTableName, Globals } from "../vulcan-lib";

Globals.findToSQL = ({ tableName, selector, options }: { tableName: CollectionNameString, selector: AnyBecauseTodo, options?: MongoFindOptions<DbObject> }) => {
  const table = Table.fromCollection(getCollectionByTableName(tableName));
  const select = new SelectQuery<DbObject>(table, selector, options);
  const { sql, args } = select.compile();
  // eslint-disable-next-line no-console
  console.log({ sql, args });
};
