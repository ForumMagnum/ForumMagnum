export const acceptsSchemaHash = "cbbfdf0c9f7aa799934b7ecc4a68697d";

import { Comments } from "../../lib/collections/comments";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, "relevantTagIds");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "relevantTagIds");
}
