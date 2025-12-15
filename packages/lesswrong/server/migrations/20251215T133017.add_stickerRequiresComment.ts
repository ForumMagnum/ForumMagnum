import { addField, dropField } from "./meta/utils";
import ForumEvents from "@/server/collections/forumEvents/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "stickerRequiresComment");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "stickerRequiresComment");
}
