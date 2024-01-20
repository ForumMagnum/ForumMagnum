import Tags from "../../lib/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "e7d890dadc54453234507be13698b7b7";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "isPostType");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "isPostType");
}
