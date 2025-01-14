import ForumEvents from "@/lib/collections/forumEvents/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "eventFormat")
  await addField(db, ForumEvents, "bannerTextColor")
  await db.none(`UPDATE "ForumEvents" SET "eventFormat" = 'POLL' WHERE "includesPoll" IS TRUE`)
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "bannerTextColor")
  await dropField(db, ForumEvents, "eventFormat")
}
