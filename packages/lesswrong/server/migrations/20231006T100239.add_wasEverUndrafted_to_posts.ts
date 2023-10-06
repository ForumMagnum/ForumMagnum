import { Posts } from "../../lib/collections/posts"
import { addField, dropField } from "./meta/utils"

export const acceptsSchemaHash = "32e3d3213b13f5c68390fe80b3f93571";

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await addField(db, Posts, "wasEverUndrafted");
    await db.none(`
      UPDATE "Posts"
      SET "wasEverUndrafted" = TRUE
      WHERE
        "draft" IS NOT TRUE OR
        "frontpageDate" IS NOT NULL OR
        "curatedDate" IS NOT NULL
    `);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await dropField(db, Posts, "wasEverUndrafted");
  }
}
