import { ArbitalTagContentRels } from "../../lib/collections/arbitalTagContentRels/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ArbitalTagContentRels);
  await updateIndexes(ArbitalTagContentRels);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ArbitalTagContentRels);
}
