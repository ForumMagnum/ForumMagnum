import Users from "../../server/collections/users/collection";
import { addField, dropField, installExtensions, updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "c192cfffc5d07ae27caf1477da048644";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideFromPeopleDirectory");
  await addField(db, Users, "profileUpdatedAt");

  // Install the pg_tgrm extension
  await installExtensions(db);

  // Add utility function to backfill `profileUpdatedAt`
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideFromPeopleDirectory");
  await installExtensions(db);
  await updateFunctions(db);
}
