/* eslint-disable no-console */
import { Vulcan, getCollection } from "../vulcan-lib";
import { getSqlClient } from "../../lib/sql/sqlClient";
import Table from "../../lib/sql/Table";
import InsertQuery from "../../lib/sql/InsertQuery";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import CreateIndexQuery from "../../lib/sql/CreateIndexQuery";
import { forEachDocumentBatchInCollection } from "../migrations/migrationUtils";
import util from "util";

// A place for nasty hacks to live...
const formatters = {
  Posts: (document: DbPost): DbPost => {
    if (typeof document.scoreExceeded75Date === "boolean") {
      document.scoreExceeded75Date = new Date(Date.now());
    }
    return document;
  },
};

const showArray = <T>(array: T[]) => util.inspect(array, {maxArrayLength: null});

Vulcan.mongoToSql = async (collectionName: CollectionNameString) => {
  console.log(`=== Migrating collection '${collectionName}' from Mongo to Postgres ===`);

  console.log("...Looking up collection");
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error(`Invalid collection: ${collectionName}`);
  }

  console.log("...Building schema");
  const table = Table.fromCollection(collection);
  const schemaFields = Object.keys(collection._schemaFields);
  const tableFields = Object.keys(table.getFields());
  console.log("...Migrating fields:", showArray(tableFields));
  const skippedFields = schemaFields.filter((field) => tableFields.indexOf(field) < 0);
  if (skippedFields.length) {
    console.warn("......Warning: Skipped fields:", showArray(skippedFields));
  }

  console.log("...Creating table");
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("SQL client not initialized");
  }
  try {
    const createQuery = new CreateTableQuery(table);
    const compiled = createQuery.compile();
    await sql.unsafe(compiled.sql, compiled.args);
  } catch (e) {
    console.error("Failed to create table");
    console.log(table);
    throw e;
  }

  console.log("...Creating indexes");
  const indexQueries = table.getIndexes().map((index) => new CreateIndexQuery(table, index));
  if (indexQueries.length === 0) {
    console.warn("...Warning: 0 indexes found: did you wait for the timeout?");
  }
  for (const indexQuery of indexQueries) {
    const compiled = indexQuery.compile();
    await sql.unsafe(compiled.sql, compiled.args);
  }

  console.log("...Copying data");
  const batchSize = 200;
  const errorIds: string[] = [];
  const formatData = formatters[collectionName] ?? ((document: DbObject) => document);
  let count = 0;
  await forEachDocumentBatchInCollection({
    collection,
    batchSize,
    callback: async (documents: Array<DbObject>) => {
      console.log(`......Migrating ${documents.length} documents from index ${count}`);
      count += batchSize;
      const queries = documents.map(async (document) => {
        try {
          const query = new InsertQuery(table, formatData(document), {}, {conflictStrategy: "upsert"});
          await query.toSQL(sql);
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
