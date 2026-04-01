import Posts from "../collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "oldSlugs");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "oldSlugs");
}
