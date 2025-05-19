import Users from "../../server/collections/users/collection";
import { BoolType } from "@/server/sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils";

export const acceptsSchemaHash = "7b3fdcd195cd62025722543603fa51e0";

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeasonNotifyForVoting");
  await dropRemovedField(db, Users, "givingSeason2023DonatedFlair");
  await dropRemovedField(db, Users, "givingSeason2023VotedFlair");
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeasonNotifyForVoting", new BoolType());
  await addRemovedField(db, Users, "givingSeason2023DonatedFlair", new BoolType());
  await addRemovedField(db, Users, "givingSeason2023VotedFlair", new BoolType());
}
