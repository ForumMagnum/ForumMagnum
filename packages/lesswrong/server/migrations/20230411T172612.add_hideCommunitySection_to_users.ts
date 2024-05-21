import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "1728cb3d532414ce56d22566ab53c3be";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideCommunitySection");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideCommunitySection");
}
