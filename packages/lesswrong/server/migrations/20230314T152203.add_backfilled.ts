export const acceptsSchemaHash = "9cc5aad21f36f801d9ce6b9e9e3ce213";

import TagRels from "../../lib/collections/tagRels/collection";
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!TagRels.isPostgres()) {
    return
  }
  
  await addField(db, TagRels, "backfilled")
}

export const down = async ({db}: MigrationContext) => {
  if (!TagRels.isPostgres()) {
    return
  }
  
  await dropField(db, TagRels, "backfilled")
}
