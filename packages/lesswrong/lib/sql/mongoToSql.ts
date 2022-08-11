import { Vulcan, getCollection } from "../vulcan-lib";
import Table from "./Table";
import { getSqlClient } from "../mongoCollection";
import { forEachDocumentBatchInCollection } from "../../server/migrations/migrationUtils";

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
  const createQuery = table.toCreateSQL(sql);
  await createQuery;

  console.log("...Creating indexes");
  const indexQueries = table.toCreateIndexSQL(sql);
  if (indexQueries.length === 0) {
    console.warn("...Warning: 0 indexes found: did you wait for the timeout?");
  }
  for (const indexQuery of indexQueries) {
    await indexQuery;
  }

  console.log("...Copying data");
  await forEachDocumentBatchInCollection({
    collection,
    batchSize: 200,
    callback: async (documents: Array<DbObject>) => {
      for (const document of documents) {
        const insertQuery = table.toInsertSQL(sql, document, true);
        await insertQuery;
      }
    },
  });

  console.log(`=== Finished migrating collection '${collectionName}' ===`);
}

export default Vulcan.mongoToSql;
