import Posts from "../collections/posts/collection";
import { dropField } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await db.none(`
    ALTER TABLE "Posts"
    ADD COLUMN IF NOT EXISTS "collabEditorEpoch" integer
  `);
  await db.none(`
    UPDATE "Posts"
    SET "collabEditorEpoch" = 1
    WHERE "collabEditorEpoch" IS NULL
  `);
  await db.none(`
    ALTER TABLE "Posts"
    ALTER COLUMN "collabEditorEpoch" SET DEFAULT 1
  `);
  await db.none(`
    ALTER TABLE "Posts"
    ALTER COLUMN "collabEditorEpoch" SET NOT NULL
  `);
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, Posts, "collabEditorEpoch");
};
