import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "8b861e3bf25c8edf6522b62bea9bf389";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "givingSeason2023VotedFlair");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "givingSeason2023VotedFlair");
}
