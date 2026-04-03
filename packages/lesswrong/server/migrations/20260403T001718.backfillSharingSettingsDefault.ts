import Posts from "@/server/collections/posts/collection";
import { updateDefaultValue } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Posts, "sharingSettings");

  await db.none(`
    UPDATE "Posts"
    SET "sharingSettings" = '{"anyoneWithLinkCan":"none","explicitlySharedUsersCan":"comment"}'::jsonb
    WHERE "sharingSettings" IS NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "Posts" ALTER COLUMN "sharingSettings" DROP DEFAULT`);
}
