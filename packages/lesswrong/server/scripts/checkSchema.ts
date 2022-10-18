/* eslint-disable no-console */
import { format } from 'sql-formatter';
import { Vulcan, getCollection } from "../vulcan-lib";
import { getAllCollections } from "../../lib/vulcan-lib/getCollection";
import Table from "../../lib/sql/Table";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";

/**
 * When importing large amounts of data, you can get a decent speed boost by running
 * `SET LOCAL synchronous_commit TO OFF` before this script. This is dangerous though,
 * and be sure to switch it back on afterwards.
 */
Vulcan.checkSchema = async () => {
  console.log(`=== Checking for schema changes ===`);
  
  const collectionNames = getAllCollections().map(c => `"${c.collectionName}"`)

  const collectionName = "Bans"
  console.log("...Looking up collection");
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error(`Invalid collection: ${collectionName}`);
  }

  console.log("...Building schema");
  const table = Table.fromCollection(collection);
  
  const createQuery = new CreateTableQuery(table);
  const compiled = createQuery.compile();
  
  console.log(format(compiled.sql))
  
  console.log("done")
}

export default Vulcan.checkSchema;
