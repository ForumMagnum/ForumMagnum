export const acceptsSchemaHash = "f0325d4a6f4663b8adc5f2ccf84737e6";

import { Posts } from "../../lib/collections/posts";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await addField(db, Posts, "eloRatings");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await dropField(db, Posts, "eloRatings");
  }
}
