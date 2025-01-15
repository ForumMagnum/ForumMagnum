import ForumEvents from "@/lib/collections/forumEvents/collection"
import { addField, dropField } from "./meta/utils"
import { Comments } from "@/lib/collections/comments/collection"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "eventFormat")
  await addField(db, ForumEvents, "bannerTextColor")
  await addField(db, Comments, "forumEventMetadata")
  await db.none(`UPDATE "ForumEvents" SET "eventFormat" = 'POLL' WHERE "includesPoll" IS TRUE`)
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "eventFormat")
  await dropField(db, ForumEvents, "bannerTextColor")
  await dropField(db, Comments, "forumEventMetadata")
}
