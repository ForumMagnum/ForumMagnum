import Users from "@/server/collections/users/collection";
import { addRemovedField, dropRemovedField } from "./meta/utils";
import { BoolType } from "../sql/Type";

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeason2024VotedFlair", new BoolType());
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeason2024VotedFlair");
}
