import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "abf1fe6538e00cc705f96b4ce8b981ff";

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
