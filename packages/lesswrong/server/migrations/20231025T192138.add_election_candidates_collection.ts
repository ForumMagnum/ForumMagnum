export const acceptsSchemaHash = "c37a0bba672a66b7889c8886795c8d7b";

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
