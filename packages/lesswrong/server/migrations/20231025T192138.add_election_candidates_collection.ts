export const acceptsSchemaHash = "9ea1ba2f0a54b06fbe9a13a1aaad555f";

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
