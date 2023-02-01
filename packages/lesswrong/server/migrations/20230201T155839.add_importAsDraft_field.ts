import RSSFeeds from "../../lib/collections/rssfeeds/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "7ea7cade23d0b233b794be743cd6ebaf";

export const up = async ({db}: MigrationContext) => {
  if (RSSFeeds.isPostgres()) {
    addField(db, RSSFeeds, "importAsDraft");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (RSSFeeds.isPostgres()) {
    dropField(db, RSSFeeds, "importAsDraft");
  }
}
