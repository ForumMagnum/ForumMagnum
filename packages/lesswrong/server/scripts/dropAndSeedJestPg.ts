import { Vulcan } from "../vulcan-lib";
import { createTestingSqlClient, killAllConnections } from "../testingSqlClient";
import { closeSqlClient } from "../sql/sqlClient";

Vulcan.dropAndSeedJestPg = async () => {
  const id = "jest_template";
  // eslint-disable-next-line no-console
  console.log("Killing connections");
  await killAllConnections(id);
  // eslint-disable-next-line no-console
  console.log("Creating database");
  const {sql} = await createTestingSqlClient(id, true, false);
  await closeSqlClient(sql);
  // eslint-disable-next-line no-console
  console.log("Finished seeding Jest PG database - exiting...");
  setTimeout(() => process.exit(0), 1000);
}
