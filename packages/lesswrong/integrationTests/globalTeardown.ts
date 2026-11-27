import { stopIntegrationTestDatabase } from "./minipgDatabase";

export default async function globalTeardown() {
  await stopIntegrationTestDatabase();
}
