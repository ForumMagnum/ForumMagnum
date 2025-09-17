import { addField, dropField } from "./meta/utils";
import ForumEvents from "../collections/forumEvents/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "hideBanner");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "hideBanner");
}
