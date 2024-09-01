import CreateIndexQuery from "@/server/sql/CreateIndexQuery";
import InsertQuery from "@/server/sql/InsertQuery";
import SelectQuery from "@/server/sql/SelectQuery";
import Table from "@/server/sql/Table";
import UpdateQuery from "@/server/sql/UpdateQuery";
import { getCollection, Globals } from "../vulcan-lib";

/**
 * Translates a mongo find query to SQL for debugging purposes.  Requires a server running because the query builder uses collections, etc.
 */
Globals.findToSQL = ({ tableName, selector, options }: { tableName: CollectionNameString, selector: AnyBecauseTodo, options?: MongoFindOptions<DbObject> }) => {
  const table = Table.fromCollection(getCollection(tableName));
  const select = new SelectQuery<DbObject>(table, selector, options);
  const { sql, args } = select.compile();
  // eslint-disable-next-line no-console
  console.log({ sql, args });
};

/**
 * Translates a mongo insert query to SQL for debugging purposes.  Requires a server running because the query builder uses collections, etc.
 */
Globals.insertToSQL = ({ tableName, data, options }: { tableName: CollectionNameString, data: DbObject, options?: MongoFindOptions<DbObject> }) => {
  const table = Table.fromCollection(getCollection(tableName));
  const insert = new InsertQuery<DbObject>(table, data, options);
  const { sql, args } = insert.compile();
  // eslint-disable-next-line no-console
  console.log({ sql, args });
};

Globals.rawUpdateOneToSQL = ({ tableName, selector, modifier }: { tableName: CollectionNameString, selector: AnyBecauseTodo, modifier: MongoModifier<DbObject> }) => {
  const table = Table.fromCollection(getCollection(tableName));
  const select = new UpdateQuery<DbObject>(table, selector, modifier);
  const { sql, args } = select.compile();
  // eslint-disable-next-line no-console
  console.log({ sql, args });
};

Globals.ensureIndexToSQL = ({ tableName, indexSpec, options }: { tableName: CollectionNameString, indexSpec: any, options?: any }) => {
  const table = Table.fromCollection(getCollection(tableName));
  const index = table.getIndex(Object.keys(indexSpec), options) ?? table.addIndex(indexSpec, options);
  const query = new CreateIndexQuery({ table, index, ifNotExists: true });
  const { sql, args } = query.compile();

  // eslint-disable-next-line no-console
  console.log('query', { indexName: index.getName(), sql, args });
};
