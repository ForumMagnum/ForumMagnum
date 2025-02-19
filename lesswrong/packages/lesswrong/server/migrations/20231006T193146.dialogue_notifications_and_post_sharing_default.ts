import Users from "../../lib/collections/users/collection";
import Posts from "../../lib/collections/posts/collection";
import {addField, dropField, updateDefaultValue} from "./meta/utils";

/**
 * Generated on 2023-10-06T19:31:46.057Z by `yarn makemigrations`
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
export const acceptsSchemaHash = "ab02d7ee110cc11f4df3b0f16a24905d";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationDialogueMessages")
  await addField(db, Users, "notificationPublishedDialogueMessages")
  await updateDefaultValue(db, Posts, "shareWithUsers")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationDialogueMessages")
  await dropField(db, Users, "notificationPublishedDialogueMessages")
  await updateDefaultValue(db, Posts, "shareWithUsers")
}
