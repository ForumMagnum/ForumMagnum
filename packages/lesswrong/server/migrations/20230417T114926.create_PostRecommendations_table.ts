import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "683ac450a95b60b5a77a851a26e1a51a";

export const up = async ({db}: MigrationContext) => {
  if (PostRecommendations.isPostgres()) {
    createTable(db, PostRecommendations);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (PostRecommendations.isPostgres()) {
    dropTable(db, PostRecommendations);
  }
}
