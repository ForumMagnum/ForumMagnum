import { addField, dropField } from "./meta/utils";
import Posts from "@/server/collections/posts/collection";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, Posts, "wordCount");
  await db.none(`
    UPDATE "Posts" AS p
    SET "wordCount" = COALESCE(r."wordCount", 0)
    FROM "Revisions" AS r
    WHERE r."_id" = p."contents_latest"
  `);
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, Posts, "wordCount");
};
