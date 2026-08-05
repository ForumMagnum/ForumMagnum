import RSSFeeds from "../collections/rssfeeds/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, RSSFeeds, "importAsQuickTake");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, RSSFeeds, "importAsQuickTake");
};
