import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "ccf166b73b25877ca82e4fe4da4238e9";

export const up = async ({db}: MigrationContext) => {
  if (PostRecommendations.isPostgres()) {
    await createTable(db, PostRecommendations);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (PostRecommendations.isPostgres()) {
    await dropTable(db, PostRecommendations);
  }
}
