import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "8ecc349268b355e0efe1de9fba8c38f9";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hidePostsRecommendations");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hidePostsRecommendations");
}
