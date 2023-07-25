import Tags from "../../lib/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "9988fb19e4c7b7f901b58c0eae949a49";

export const up = async ({db}: MigrationContext) => {
  if (Tags.isPostgres()) {
    await addField(db, Tags, "isPostType");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Tags.isPostgres()) {
    await dropField(db, Tags, "isPostType");
  }
}
