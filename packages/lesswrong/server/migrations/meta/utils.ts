import PgCollection from "../../../lib/sql/PgCollection";
import AddFieldQuery from "../../../lib/sql/AddFieldQuery";
import UpdateDefaultValueQuery from "../../../lib/sql/UpdateDefaultValueQuery";
import UpdateFieldTypeQuery from "../../../lib/sql/UpdateFieldTypeQuery";
import TableIndex from "../../../lib/sql/TableIndex";
import DropIndexQuery from "../../../lib/sql/DropIndexQuery";
import CreateIndexQuery from "../../../lib/sql/CreateIndexQuery";

export const addField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql, args} = new AddFieldQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

export const updateDefaultValue = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql, args} = new UpdateDefaultValueQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

export const updateFieldType = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql, args} = new UpdateFieldTypeQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

export const dropIndex = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  index: TableIndex,
): Promise<void> => {
  const {sql, args} = new DropIndexQuery(collection.getTable(), index).compile();
  await db.none(sql, args);
}

export const createIndex = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  index: TableIndex,
  ifNotExists = true,
): Promise<void> => {
  const {sql, args} = new CreateIndexQuery(collection.getTable(), index, ifNotExists).compile();
  await db.none(sql, args);
}
