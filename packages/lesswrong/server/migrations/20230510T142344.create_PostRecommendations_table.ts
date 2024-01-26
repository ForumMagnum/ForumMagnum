import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "f38ed1e13515715dfc7ea5a8d6ea01df";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, PostRecommendations);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, PostRecommendations);
}
