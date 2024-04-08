import Users from "../../lib/collections/users/collection";
import { addField, dropField, installExtensions, updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "2e72142778afe2442e81e05a1d285fb5";

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
