import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "9f4ba49ceedbc502e6d30b03fb1b54df";

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
