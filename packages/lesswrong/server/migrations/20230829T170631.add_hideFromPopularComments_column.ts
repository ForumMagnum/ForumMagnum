import { Posts } from "../../lib/collections/posts"
import { addField, dropField } from "./meta/utils"

export const acceptsSchemaHash = "7d3553d2dcd4a5e47968398dfee076f2";

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
