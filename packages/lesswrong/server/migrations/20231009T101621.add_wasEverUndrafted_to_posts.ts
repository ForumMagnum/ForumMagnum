import { Posts } from "../../server/collections/posts/collection"
import { addField, dropField } from "./meta/utils"

export const acceptsSchemaHash = "881c509060130982ab7f20a92a5c9602";

export const up = async ({db}: MigrationContext) => {
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

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "wasEverUndrafted");
}
