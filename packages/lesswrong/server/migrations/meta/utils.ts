import PgCollection from "../../../lib/sql/PgCollection";
import AddFieldQuery from "../../../lib/sql/AddFieldQuery";
import UpdateDefaultValueQuery from "../../../lib/sql/UpdateDefaultValueQuery";
import DropDefaultValueQuery from "../../../lib/sql/DropDefaultValueQuery";
import UpdateFieldTypeQuery from "../../../lib/sql/UpdateFieldTypeQuery";
import TableIndex from "../../../lib/sql/TableIndex";
import DropIndexQuery from "../../../lib/sql/DropIndexQuery";
import CreateIndexQuery from "../../../lib/sql/CreateIndexQuery";
import CreateTableQuery from "../../../lib/sql/CreateTableQuery";
import DropTableQuery from "../../../lib/sql/DropTableQuery";
import DropFieldQuery from "../../../lib/sql/DropFieldQuery";

export const addField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql, args} = new AddFieldQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

/**
 * WARNING: Please use addField instead (if possible)!
 *
 * This is the same as addField, just typed differently to handle the case
 * when the field is not currently in the schema (ex. it was subsequently removed).
 */
export const addRemovedField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: string,
): Promise<void> => {
  const {sql, args} = new AddFieldQuery(collection.getTable(), fieldName, true).compile();
  await db.none(sql, args);
}

export const dropField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql, args} = new DropFieldQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

/**
 * WARNING: Please use dropField instead (if possible)!
 *
 * This is the same as dropField, just typed differently to handle the case
 * when the field is not currently in the schema (ex. it was subsequently removed).
 */
export const dropRemovedField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: string,
): Promise<void> => {
  const {sql, args} = new DropFieldQuery(collection.getTable(), fieldName, true).compile();
  await db.none(sql, args);
}

export const updateDefaultValue = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  let defaultValueQuery: UpdateDefaultValueQuery<T>|undefined
  try {
    defaultValueQuery = new UpdateDefaultValueQuery(collection.getTable(), fieldName)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return
  }
  const {sql, args} = defaultValueQuery.compile();
  await db.none(sql, args);
}

export const dropDefaultValue = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql, args} = new DropDefaultValueQuery(collection.getTable(), fieldName).compile();
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
  index: TableIndex<T>,
): Promise<void> => {
  const {sql, args} = new DropIndexQuery(collection.getTable(), index).compile();
  await db.none(sql, args);
}

export const createIndex = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  index: TableIndex<T>,
  ifNotExists = true,
): Promise<void> => {
  const {sql, args} = new CreateIndexQuery(collection.getTable(), index, ifNotExists).compile();
  await db.none(sql, args);
}

export const dropTable = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
): Promise<void> => {
  const {sql, args} = new DropTableQuery(collection.getTable()).compile();
  await db.none(sql, args);
}

export const createTable = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  ifNotExists = true,
): Promise<void> => {
  const table = collection.getTable();
  const {sql, args} = new CreateTableQuery(table, ifNotExists).compile();
  await db.none(sql, args);
  for (const index of table.getIndexes()) {
    await createIndex(db, collection, index, ifNotExists);
  }
}
