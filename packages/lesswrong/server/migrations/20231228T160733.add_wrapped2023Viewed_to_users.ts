export const acceptsSchemaHash = "2c8fcbdc99caee38d7f728acc6428352";

import Users from "../../lib/vulcan-users";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "wrapped2023Viewed");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "wrapped2023Viewed");
}
