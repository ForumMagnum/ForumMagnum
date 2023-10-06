import {addField, dropField} from "./meta/utils";
import Users from "../../lib/collections/users/collection";

/**
 * Generated on 2023-10-06T00:16:13.001Z by `yarn makemigrations`
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
export const acceptsSchemaHash = "b4ce54de2bace9053d82bab6730be031";

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return
  await addField(db, Users, "notificationDialogueMessages")
  await addField(db, Users, "notificationPublishedDialogueMessages")
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return
  await dropField(db, Users, "notificationDialogueMessages")
  await dropField(db, Users, "notificationPublishedDialogueMessages")
}
