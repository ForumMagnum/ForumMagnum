/**
 * Generated on 2024-01-11T00:33:12.446Z by `yarn makemigrations`
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
export const acceptsSchemaHash = "2431de6961ce37514d54a17a5ca14adc";

import Users from "../../lib/collections/users/collection"
import { NotificationTypeSettings } from "../../lib/collections/users/schema";
import { updateDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  const newSettings: NotificationTypeSettings = {
    channel: 'none',
    dayOfWeekGMT: 'Monday',
    timeOfDayGMT: 12,
    batchingFrequency: 'realtime'
  };

  await updateDefaultValue(db, Users, 'notificationNewDialogueChecks');
  await db.any(`
    UPDATE "Users"
    SET "notificationNewDialogueChecks" = $1
  `, [newSettings]);
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
