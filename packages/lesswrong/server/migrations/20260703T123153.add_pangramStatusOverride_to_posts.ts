import { addField, dropField } from "./meta/utils";
import Posts from "../collections/posts/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "pangramStatusOverride");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "pangramStatusOverride");
}
