/* eslint-disable no-console */
import type { ITask } from "pg-promise";
import { Vulcan, getCollection } from "../vulcan-lib";
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import Table from "../../lib/sql/Table";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import CreateIndexQuery from "../../lib/sql/CreateIndexQuery";
import InsertQuery from "../../lib/sql/InsertQuery";
import SwitchingCollection from "../../lib/SwitchingCollection";

type Transaction = ITask<{}>;

// Custom formatters to fix data integrity issues on a per-collection basis
// A place for nasty hacks to live...
const formatters: Partial<Record<CollectionNameString, (document: DbObject) => DbObject>> = {
  Posts: (post: DbPost): DbPost => {
    const scoreThresholds = [2, 30, 45, 75, 125, 200];
    for (const threshold of scoreThresholds) {
      const prop = `scoreExceeded${threshold}Date`;
      if (typeof post[prop] === "boolean") {
        post[prop] = null;
      }
    }
    if (!post.title) {
      post.title = "";
    }
    return post;
  },
};

const getCollectionFormatter = (collection: SwitchingCollection<DbObject>) =>
  formatters[collection.getName()] ?? ((document: DbObject) => document);

const createTables = async (sql: Transaction, collections: SwitchingCollection<DbObject>[]) => {
  console.log("...Creating tables");
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    if (!(table instanceof Table)) {
      throw new Error(`Collection '${collection.getName()}' does not have a valid table`);
    }
    const createQuery = new CreateTableQuery(table);
    const compiled = createQuery.compile();
    await sql.none(compiled.sql, compiled.args);
  }
}

const createIndexes = async (sql: Transaction, collections: SwitchingCollection<DbObject>[]) => {
  console.log("...Creating indexes");
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    const indexQueries = table.getIndexes().map((index) => new CreateIndexQuery(table, index));
    if (indexQueries.length === 0) {
      console.warn("...Warning: 0 indexes found: did you wait for the server timeout?");
    }
    for (const indexQuery of indexQueries) {
      const compiled = indexQuery.compile();
      await sql.none(compiled.sql, compiled.args);
    }
  }
}

const setLogged = async (sql: Transaction, collections: SwitchingCollection<DbObject>[], logged: boolean) => {
  console.log("...Making tables logged");
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;
    await sql.none(`ALTER TABLE "${table.getName()}" SET ${logged ? "LOGGED" : "UNLOGGED"}`);
  }
}

const pickBatchSize = (collection: SwitchingCollection<DbObject>) => {
  // The Postgres protocol stores parameter indexes as a U16, so there can't be more than 65535
  // arguments in a single query. We use this to make the largest batch size possible based off
  // of the number of fields in the schema.
  const max = 65535
  const numFields = collection.getTable().countFields();
  return Math.floor(max / numFields);
}

const makeBatchFilter = (createdSince?: Date) =>
  createdSince
    ? { createdAt: { $gte: createdSince } }
    : {};

const copyData = async (
  sql: Transaction,
  collections: SwitchingCollection<DbObject>[],
  pass: number,
  createdSince?: Date,
) => {
  console.log(`...Copying data (pass ${pass})`);
  for (const collection of collections) {
    console.log(`......${collection.getName()}`);
    const table = collection.getPgCollection().table;

    const formatter = getCollectionFormatter(collection);
    const batchSize = pickBatchSize(collection);
    let count = 0;
    await forEachDocumentBatchInCollection({
      collection: collection.getMongoCollection() as unknown as CollectionBase<DbObject>,
      batchSize,
      filter: makeBatchFilter(createdSince),
      callback: async (documents: DbObject[]) => {
        console.log(`.........Migrating ${collection.getName()} documents ${count}-${count + documents.length}`);
        count += batchSize;
        const query = new InsertQuery(table, documents.map(formatter), {}, {conflictStrategy: "ignore"});
        const compiled = query.compile();
        try {
          await sql.none(compiled.sql, compiled.args);
        } catch (e) {
          throw new Error(`Error importing document batch for collection ${collection.getName()}: ${e.message}`);
        }
      },
    });
  }
}

export const migrateCollections = async (collectionNames: CollectionNameString[]) => {
  console.log(`=== Migrating collections '${collectionNames}' from Mongo to Postgres ===`);

  console.log("...Preparing collections");
  const collections = collectionNames.map(getCollection) as unknown as SwitchingCollection<DbObject>[];
  for (const [index, collection] of collections.entries()) {
    if (!collection) {
      throw new Error(`Invalid collection name '${collectionNames[index]}'`);
    }

    if (!(collection instanceof SwitchingCollection)) {
      throw new Error(`Collection '${collectionNames[index]}' is not a SwitchingCollection`);
    }

    collection.setTargets("mongo", "mongo");
  }

  console.log("...Beginning SQL transaction");
  const sql = getSqlClientOrThrow();
  try {
    await sql.tx(async (transaction) => {
      await createTables(transaction, collections);
      await createIndexes(transaction, collections);
      await setLogged(transaction, collections, false);

      const copyStart = new Date();
      await copyData(transaction, collections, 1);
      await setLogged(transaction, collections, true);

      const copyStart2 = new Date();
      await copyData(transaction, collections, 2, copyStart);

      for (const collection of collections) {
        collection.setTargets("mongo", "pg");
      }

      // Once more for luck...
      await copyData(transaction, collections, 3, copyStart2);

      for (const collection of collections) {
        collection.setTargets("pg", "pg");
      }

      console.log("\ud83c\udfc1 Done!");
    });
  } catch (e) {
    for (const collection of collections) {
      collection.setTargets("mongo", "mongo");
    }
    console.error("Error:", e.message);
    console.log("\ud83d\uded1 Migration aborted!");
  }
}

Vulcan.migrateCollections = migrateCollections;
