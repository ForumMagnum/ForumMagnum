import { createTestingSqlClient, killAllConnections } from "../testingSqlClient";
import { closeSqlClient } from "../sql/sqlClient";

// Exported to allow running manually with "yarn repl"
export const dropAndSeedJestPg = async () => {
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
