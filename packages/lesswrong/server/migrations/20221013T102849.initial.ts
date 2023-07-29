import type { ITask } from "pg-promise";
import Table from "../../lib/sql/Table";
import CreateIndexQuery from "../../lib/sql/CreateIndexQuery";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { getAllCollections } from "../../lib/vulcan-lib";
import PgCollection from "../../lib/sql/PgCollection";

type Transaction = ITask<{}>;

const createTables = async (sql: Transaction, collections: PgCollection<DbObject>[]) => {
  console.log("...Creating tables");
  for (const collection of collections) {
    console.log(`......${collection.collectionName}`);
    const table = collection.table;
    if (!(table instanceof Table)) {
      throw new Error(`Collection '${collection.collectionName}' does not have a valid table`);
    }
    const createQuery = new CreateTableQuery(table);
    const compiled = createQuery.compile();
    await sql.none(compiled.sql, compiled.args);
  }
}

const createIndexes = async (sql: Transaction, collections: PgCollection<DbObject>[]) => {
  console.log("...Creating indexes");
  for (const collection of collections) {
    console.log(`......${collection.collectionName}`);
    const table = collection.table;
    // TODO type index
    const indexQueries = table.getIndexes().map((index: AnyBecauseTodo) => new CreateIndexQuery(table, index));
    if (indexQueries.length === 0) {
      console.warn("...Warning: 0 indexes found: did you wait for the server timeout?");
    }
    for (const indexQuery of indexQueries) {
      const compiled = indexQuery.compile();
      await sql.none(compiled.sql, compiled.args);
    }
  }
}

export const up = async ({db}: MigrationContext) => {
  const result = await db.one("SELECT current_database() AS db");
  // eslint-disable-next-line no-console
  console.log("Using database:", result.db);

  console.log("...Beginning SQL transaction");
  const sql = getSqlClientOrThrow();
  const collections = getAllCollections() as unknown as PgCollection<DbObject>[]

  // await sql.tx(async (transaction) => {
  //   await createTables(transaction, collections);
  //   await createIndexes(transaction, collections);
  // })
}
