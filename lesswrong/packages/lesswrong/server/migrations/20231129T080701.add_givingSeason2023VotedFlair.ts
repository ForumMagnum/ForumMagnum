import Users from "../../lib/collections/users/collection";
import { BoolType } from "../../server/sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils";

export const acceptsSchemaHash = "8b861e3bf25c8edf6522b62bea9bf389";

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeason2023VotedFlair", new BoolType());
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeason2023VotedFlair");
}
