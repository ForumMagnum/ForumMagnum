import { startIntegrationTestDatabase } from "./minipgDatabase";

export default async function globalSetup() {
  await startIntegrationTestDatabase();
}
