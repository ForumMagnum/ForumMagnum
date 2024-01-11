import Users from "../../lib/vulcan-users";
import { addRemovedField, dropRemovedField } from "./meta/utils";

export const acceptsSchemaHash = "5dd77504112d1ae372839bb1dbc2bf1d";

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeasonNotifyForVoting");
  await dropRemovedField(db, Users, "givingSeason2023DonatedFlair");
  await dropRemovedField(db, Users, "givingSeason2023VotedFlair");
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeasonNotifyForVoting");
  await addRemovedField(db, Users, "givingSeason2023DonatedFlair");
  await addRemovedField(db, Users, "givingSeason2023VotedFlair");
}
