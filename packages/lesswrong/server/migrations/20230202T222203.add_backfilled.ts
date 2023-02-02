t export const acceptsSchemaHash = "f3bb9b35520db60be5d6640c1be3377b";

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
