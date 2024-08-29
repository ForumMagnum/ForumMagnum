import DoppelComments from "@/lib/collections/doppelComments/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const acceptsSchemaHash = "68a03187ab4d9f263dbd9a713fcf7f67";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, DoppelComments);
  await updateIndexes(DoppelComments);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DoppelComments);
}
