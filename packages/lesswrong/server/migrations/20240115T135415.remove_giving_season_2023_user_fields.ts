import Users from "../../lib/vulcan-users";
import { addRemovedField, dropRemovedField } from "./meta/utils";

export const acceptsSchemaHash = "3f5776b3718d3ac264f38fad3378eb02";

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
