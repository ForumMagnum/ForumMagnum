import Users from "../../server/collections/users/collection";
import {updateDefaultValue} from "./meta/utils";
/**
 * Generated on 2023-10-06T21:44:57.384Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "d42e531dd915561448e15e72551b1d71";

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Users, "notificationDialogueMessages")
  await updateDefaultValue(db, Users, "notificationPublishedDialogueMessages")
}

export const down = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Users, "notificationDialogueMessages")
  await updateDefaultValue(db, Users, "notificationPublishedDialogueMessages")
}
