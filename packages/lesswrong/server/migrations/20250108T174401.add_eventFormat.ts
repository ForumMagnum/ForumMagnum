import ForumEvents from "@/server/collections/forumEvents/collection"
import { addField, dropField } from "./meta/utils"
import { Comments } from "@/server/collections/comments/collection"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "eventFormat")
  await addField(db, ForumEvents, "maxStickersPerUser")
  await addField(db, ForumEvents, "bannerTextColor")
  await addField(db, ForumEvents, "commentPrompt")
  await addField(db, Comments, "forumEventMetadata")
  await db.none(`ALTER TABLE "ForumEvents" ALTER COLUMN "tagId" DROP NOT NULL`)
  await db.none(`UPDATE "ForumEvents" SET "eventFormat" = 'POLL' WHERE "includesPoll" IS TRUE`)
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "eventFormat")
  await dropField(db, ForumEvents, "maxStickersPerUser")
  await dropField(db, ForumEvents, "bannerTextColor")
  await dropField(db, ForumEvents, "commentPrompt")
  await dropField(db, Comments, "forumEventMetadata")
}
