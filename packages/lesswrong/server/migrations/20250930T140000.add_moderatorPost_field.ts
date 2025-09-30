import { addField, dropField, updateIndexes } from "./meta/utils"
import Posts from "../collections/posts/collection";

export const up = async ({db}: MigrationContext) => {
  // Add the new timestamp field
  await addField(db, Posts, "moderatorPost" as any);
  await updateIndexes(Posts);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "moderatorPost" as any);
  await updateIndexes(Posts);
}
