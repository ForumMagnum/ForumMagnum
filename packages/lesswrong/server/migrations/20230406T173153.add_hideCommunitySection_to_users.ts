import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "4de793cf9e6f1cb7ce6669fa436e1185";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "hideCommunitySection");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "hideCommunitySection");
  }
}
