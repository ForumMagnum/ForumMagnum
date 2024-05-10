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
import CreateExtensionQuery from "../../../lib/sql/CreateExtensionQuery";
import { postgresExtensions } from "../../postgresExtensions";
import { postgresFunctions } from "../../postgresFunctions";
import type { ITask } from "pg-promise";
import { Type } from "../../../lib/sql/Type";
import LogTableQuery from "../../../lib/sql/LogTableQuery";
import {
  expectedIndexes,
  expectedCustomPgIndexes,
} from "../../../lib/collectionIndexUtils";
import { getPostgresViewByName } from "../../postgresView";
import { sleep } from "../../../lib/utils/asyncUtils";

type SqlClientOrTx = SqlClient | ITask<{}>;

export const addField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: keyof ObjectsByCollectionName[N] & string,
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
export const addRemovedField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: string,
  type: Type,
): Promise<void> => {
  const {sql, args} = new AddFieldQuery(collection.getTable(), fieldName, type).compile();
  await db.none(sql, args);
}

export const dropField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: keyof ObjectsByCollectionName[N] & string,
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
export const dropRemovedField = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: string,
): Promise<void> => {
  const {sql, args} = new DropFieldQuery(collection.getTable(), fieldName, true).compile();
  await db.none(sql, args);
}

export const updateDefaultValue = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: keyof ObjectsByCollectionName[N] & string,
): Promise<void> => {
  const {sql, args} = new UpdateDefaultValueQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

export const dropDefaultValue = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: keyof ObjectsByCollectionName[N] & string,
): Promise<void> => {
  const {sql, args} = new DropDefaultValueQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

export const updateFieldType = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  fieldName: keyof ObjectsByCollectionName[N] & string,
): Promise<void> => {
  const {sql, args} = new UpdateFieldTypeQuery(collection.getTable(), fieldName).compile();
  await db.none(sql, args);
}

export const dropIndex = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  index: TableIndex<ObjectsByCollectionName[N]>,
): Promise<void> => {
  const {sql, args} = new DropIndexQuery(collection.getTable(), index).compile();
  await db.none(sql, args);
}

export const createIndex = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  index: TableIndex<ObjectsByCollectionName[N]>,
  ifNotExists = true,
  allowConcurrent = true,
): Promise<void> => {
  const {sql, args} = new CreateIndexQuery(collection.getTable(), index, ifNotExists, allowConcurrent).compile();
  await db.none(sql, args);
}

export const dropTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
): Promise<void> => {
  const {sql, args} = new DropTableQuery(collection.getTable()).compile();
  await db.none(sql, args);
}

export const createTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
  ifNotExists = true,
): Promise<void> => {
  const table = collection.getTable();
  const {sql, args} = new CreateTableQuery(table, ifNotExists).compile();
  await db.none(sql, args);
  for (const index of table.getIndexes()) {
    await createIndex(db, collection, index, ifNotExists);
  }
}

export const unlogTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
): Promise<void> => {
  const table = collection.getTable();
  const {sql, args} = new LogTableQuery(table, "UNLOGGED").compile();
  await db.none(sql, args);
}

export const logTable = async <N extends CollectionNameString>(
  db: SqlClientOrTx,
  collection: CollectionBase<N>,
): Promise<void> => {
  const table = collection.getTable();
  const {sql, args} = new LogTableQuery(table, "LOGGED").compile();
  await db.none(sql, args);
}

export const installExtensions = async (db: SqlClientOrTx) => {
  for (const extension of postgresExtensions) {
    const {sql, args} = new CreateExtensionQuery(extension).compile();
    await db.none(sql, args);
  }
}

export const updateFunctions = async (db: SqlClientOrTx) => {
  for (const query of postgresFunctions) {
    await db.none(query);
  }
}

export const updateIndexes = async <N extends CollectionNameString>(
  collection: CollectionBase<N>,
): Promise<void> => {
  for (const index of expectedIndexes[collection.collectionName] ?? []) {
    await collection._ensureIndex(index.key, index);
    await sleep(100);
  }
}

export const updateCustomIndexes = async (db: SqlClientOrTx) => {
  for (const index of expectedCustomPgIndexes) {
    await db.none(index);
    await sleep(100);
  }
}

export const updateView = async (db: SqlClientOrTx, name: string) => {
  const view = getPostgresViewByName(name);
  const query = view.getCreateViewQuery();
  await db.none(query);
  await sleep(100);
  for (const index of view.getCreateIndexQueries()) {
    await db.none(index);
    await sleep(100);
  }
}
