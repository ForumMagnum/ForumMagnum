import { Posts } from "../../lib/collections/posts"
import { addField, dropField } from "./meta/utils"

export const acceptsSchemaHash = "0aa0f7cf74bca417434ee16714ec081d";

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    addField(db, Posts, "hideFromPopularComments");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    dropField(db, Posts, "hideFromPopularComments");
  }
}
