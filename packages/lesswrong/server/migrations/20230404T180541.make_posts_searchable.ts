import { Posts } from "../../lib/collections/posts";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "a22731092d3f9f7c414a9695bbc8c6a9";

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    addField(db, Posts, "searchVector");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    dropField(db, Posts, "searchVector");
  }
}
