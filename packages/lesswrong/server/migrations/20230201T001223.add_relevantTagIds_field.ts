export const acceptsSchemaHash = "648adc678a9728446edee9eb45518d8b";

import { Comments } from "../../lib/collections/comments";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Comments.isPostgres()) {
    await addField(db, Comments, "relevantTagIds");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Comments.isPostgres()) {
    await dropField(db, Comments, "relevantTagIds");
  }
}
