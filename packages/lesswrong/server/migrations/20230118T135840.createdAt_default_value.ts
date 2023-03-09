export const acceptsSchemaHash = "afb5555a6e3a18714877036b68c63786";

import { Collections } from "../vulcan-lib"
import { updateDefaultValue, dropDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  for (const collection of Collections) {
    if (collection.isPostgres()) {
      await updateDefaultValue(db, collection, "createdAt");
    }
  }
}

export const down = async ({db}: MigrationContext) => {
  for (const collection of Collections) {
    if (collection.isPostgres()) {
      await dropDefaultValue(db, collection, "createdAt");
    }
  }
}
