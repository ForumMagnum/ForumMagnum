import { MultiDocuments } from "@/server/collections/multiDocuments/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, MultiDocuments);
  await updateIndexes(MultiDocuments);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, MultiDocuments);
}
