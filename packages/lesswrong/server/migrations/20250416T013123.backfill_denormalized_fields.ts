import { createDisplayName } from "@/lib/collections/users/newSchema";
import Users from "../collections/users/collection"

export const up = async ({db}: MigrationContext) => {
  const users = await Users.find({ displayName: { $exists: false } }).fetch();
  for (const user of users) {
    const displayName = createDisplayName(user);
    await Users.rawUpdateOne({ _id: user._id }, { $set: { displayName } });
  }

  await db.none(`ALTER TABLE "Users" ALTER COLUMN "displayName" SET NOT NULL`);

  await db.none(`UPDATE "Conversations" SET "latestActivity" = "createdAt" WHERE "latestActivity" IS NULL`);
  await db.none(`ALTER TABLE "Conversations" ALTER COLUMN "latestActivity" SET NOT NULL`);

  await db.none(`UPDATE "Revisions" SET "editedAt" = "createdAt" WHERE "editedAt" IS NULL`);
  await db.none(`ALTER TABLE "Revisions" ALTER COLUMN "editedAt" SET NOT NULL`);

  await db.none(`UPDATE "Posts" SET "lastCommentedAt" = "postedAt" WHERE "lastCommentedAt" IS NULL`);
  await db.none(`ALTER TABLE "Posts" ALTER COLUMN "lastCommentedAt" SET NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
}
