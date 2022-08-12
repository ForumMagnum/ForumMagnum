import { Vulcan, getCollection } from "../vulcan-lib";
import Table from "./Table";
import { getSqlClient } from "../mongoCollection";
import { forEachDocumentBatchInCollection } from "../../server/migrations/migrationUtils";

// A place for nasty hacks to live...
const formatters = {
  Posts: (document: DbPost): DbPost => {
    if (typeof document.scoreExceeded75Date === "boolean") {
      document.scoreExceeded75Date = new Date(Date.now());
    }
    return document;
  },
};

Vulcan.mongoToSql = async (collectionName: CollectionNameString) => {
  console.log(`=== Migrating collection '${collectionName}' from Mongo to Postgres ===`);

  console.log("...Looking up collection");
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error(`Invalid collection: ${collectionName}`);
  }

  console.log("...Building schema");
  const table = Table.fromCollection(collection);

  console.log("...Creating table");
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("SQL client not initialized");
  }
  try {
    const createQuery = table.toCreateSQL(sql);
    await createQuery;
  } catch (e) {
    console.error("Failed to create table");
    console.log(table);
    throw e;
  }

  console.log("...Creating indexes");
  const indexQueries = table.toCreateIndexSQL(sql);
  if (indexQueries.length === 0) {
    console.warn("...Warning: 0 indexes found: did you wait for the timeout?");
  }
  for (const indexQuery of indexQueries) {
    await indexQuery;
  }

  console.log("...Copying data");
  const batchSize = 200;
  const errorIds: string[] = [];
  const formatData = formatters[collectionName] ?? ((document) => document);
  let count = 0;
  await forEachDocumentBatchInCollection({
    collection,
    batchSize,
    callback: async (documents: Array<DbObject>) => {
      console.log(`......Migrating ${documents.length} documents from index ${count}`);
      count += batchSize;
      const queries = documents.map(async (document) => {
        try {
          await table.toInsertSQL(sql, formatData(document), true);
        } catch (e) {
          console.error(`ERROR IMPORTING DOCUMENT ${document._id}`);
          console.error(e);
          errorIds.push(document._id);
        }
      });
      await Promise.all(queries);
    },
  });

  if (errorIds.length) {
    console.log(`...${errorIds.length} import errors:`, errorIds);
  }

  console.log(`=== Finished migrating collection '${collectionName}' ===`);
}

export default Vulcan.mongoToSql;
