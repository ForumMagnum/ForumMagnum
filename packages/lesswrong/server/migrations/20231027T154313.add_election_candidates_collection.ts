export const acceptsSchemaHash = "5e28a08c9be1ba704a99a94dab5c4fae";

import ElectionCandidates from "../../lib/collections/electionCandidates/collection"
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (ElectionCandidates.isPostgres()) {
    await createTable(db, ElectionCandidates);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (ElectionCandidates.isPostgres()) {
    await dropTable(db, ElectionCandidates);
  }
}
