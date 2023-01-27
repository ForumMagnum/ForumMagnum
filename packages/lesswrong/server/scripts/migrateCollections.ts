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
import type { ReadTarget, WriteTarget } from "../../lib/mongo2PgLock";
import omit from "lodash/omit";

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
  Chapters: (chapter: DbChapter): DbChapter => {
    chapter.postIds ??= [];
    return chapter;
  },
  Migrations: (migration: DbMigration): DbMigration => {
    migration.finished ??= false;
    migration.succeeded ??= false;
    return migration;
  },
  Users: (user: DbUser): DbUser => {
    user.isAdmin = !!user.isAdmin;
    return user;
  }
};

type DbObjectWithLegacyData = DbObject & {legacyData?: any};

const getLegacyData = (fieldNames: string[], data: DbObjectWithLegacyData) => {
  const legacyData = omit(data, fieldNames);
  return Object.keys(legacyData).length ? legacyData : undefined;
}

const getCollectionFormatter = (collection: SwitchingCollection<DbObject>) => {
  const fieldNames = Object.keys(collection.getPgCollection().table.getFields());
  const formatter = formatters[collection.getName()] ?? ((document: DbObject) => document);
  return (document: DbObjectWithLegacyData) => {
    const legacyData = getLegacyData(fieldNames, document);
    if (legacyData) {
      if (document.legacyData) {
        Object.assign(document.legacyData, legacyData);
      } else {
        document.legacyData = legacyData;
      }
    }
    return formatter(document);
  };
}

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
  const max = 65535;
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

    const totalCount = await collection.getMongoCollection().find({}).count();
    const formatter = getCollectionFormatter(collection);
    const batchSize = pickBatchSize(collection);
    let count = 0;
    await forEachDocumentBatchInCollection({
      collection: collection.getMongoCollection() as unknown as CollectionBase<DbObject>,
      batchSize,
      filter: makeBatchFilter(createdSince),
      callback: async (documents: DbObject[]) => {
        const end = count + documents.length;
        console.log(`.........Migrating '${collection.getName()}' documents ${count}-${end} of ${totalCount}`);
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

/**
 * Write new collection targets to the lock and propogate to the live server instances.
 * Note that this uses the global SQL client, not the migration transaction.
 */
const writeCollectionTargets = async (
  collections: SwitchingCollection<DbObject>[],
  readTarget: ReadTarget,
  writeTarget: WriteTarget,
): Promise<void> => {
  await Promise.all(collections.map((collection) => {
    collection.setTargets(readTarget, writeTarget);
    return collection.writeToLock();
  }));

  // Wait for propogation
  return new Promise((resolve) => {
    setTimeout(resolve, 3 * SwitchingCollection.POLL_RATE_SECONDS);
  });
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
  }

  // This should already be the case, but make sure
  await writeCollectionTargets(collections, "mongo", "mongo");

  console.log("...Beginning SQL transaction");
  const sql = getSqlClientOrThrow();
  try {
    await sql.tx(async (transaction) => {
      // Create the tables
      await createTables(transaction, collections);
      await createIndexes(transaction, collections);
      await setLogged(transaction, collections, false);

      // Copy the initial data - this can take a *long* time depending on the collection
      const copyStart = new Date();
      await copyData(transaction, collections, 1);
      await setLogged(transaction, collections, true);

      // Copy anything that was inserted during the first copy - this should be ~instant
      const copyStart2 = new Date();
      await copyData(transaction, collections, 2, copyStart);

      // Start writing to Postgres
      await writeCollectionTargets(collections, "mongo", "pg");

      // Once more for luck...
      await copyData(transaction, collections, 3, copyStart2);
    });

    // Fully move to Postgres and write the lock in case the server restarts at some point
    await writeCollectionTargets(collections, "pg", "pg");

    console.log("\ud83c\udfc1 Done!");
  } catch (e) {
    console.error("Error:", e.message);
    await writeCollectionTargets(collections, "mongo", "mongo");
    console.log("\ud83d\uded1 Migration aborted!");
  }
}

Vulcan.migrateCollections = migrateCollections;
