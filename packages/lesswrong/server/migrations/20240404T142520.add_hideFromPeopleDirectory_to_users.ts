import { addField, dropField, installExtensions } from "./meta/utils";
import Users from "../../lib/vulcan-users";

export const acceptsSchemaHash = "64f8f3a5ab2b5cb1b149231ca630feed";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideFromPeopleDirectory");

  // This PR also adds the pg_tgrm extension which we need to install
  await installExtensions(db);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideFromPeopleDirectory");
  await installExtensions(db);
}
