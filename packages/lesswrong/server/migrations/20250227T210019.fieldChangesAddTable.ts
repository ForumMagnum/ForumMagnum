import { FieldChanges } from "@/server/collections/fieldChanges/collection"
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, FieldChanges);
}

export const down = async ({db}: MigrationContext) => {
}
