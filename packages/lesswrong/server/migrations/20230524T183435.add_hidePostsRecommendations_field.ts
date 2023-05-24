import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "130c3768e4ab0c5e2532e5d7b58db9a0";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "hidePostsRecommendations");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "hidePostsRecommendations");
  }
}
