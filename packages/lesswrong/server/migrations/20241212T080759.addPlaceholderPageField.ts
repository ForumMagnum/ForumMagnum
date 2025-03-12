import Tags from "@/server/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "isPlaceholderPage");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "isPlaceholderPage");
}
