import { FeedItemServings } from "@/server/collections/feedItemServings/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, FeedItemServings, "itemContent");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, FeedItemServings, "itemContent");
}
