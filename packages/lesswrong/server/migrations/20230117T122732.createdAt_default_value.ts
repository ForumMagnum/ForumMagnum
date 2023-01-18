export const acceptsSchemaHash = "17b3602e26c300f477a4c80d4b6c6617";

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
