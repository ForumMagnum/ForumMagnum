import { Vulcan } from "../vulcan-lib";
import Table from "./Table";
import { getSqlClient } from "../mongoCollection";

Vulcan.mongoToSql = async (name: CollectionNameString) => {
  console.log(`=== Migrating collection '${name}' from Mongo to Postgres ===`);
  console.log("...Building schema");
  const table = Table.fromCollectionName(name);

  console.log("...Creating table");
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("SQL client not initialized");
  }
  const createQuery = table.toCreateSQL();
  await sql.unsafe(createQuery);

  console.log(`=== Finished migrating collection '${name}' ===`);
}

export default Vulcan.mongoToSql;
