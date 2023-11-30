/**
 * Generated on 2023-11-30T01:26:54.111Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index 0e26c1c98e..5b0819df17 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6ee0467b3cdea6d954c14e9bee545c42
 * -
 * --- Accepted on 2023-11-29T20:02:15.000Z by 20231129T200215.addNotificationNewDialogueChecks.ts
 * +-- Overall schema hash: ea10555b6fef67efb7ab0cbbdfdb8772
 *  
 * @@ -1133,3 +1131,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 698b626d9959c4ee04993fea28a5263d
 * +-- Schema for "Users", hash: 8b90207b4966ab3b80cf95db6cc89bc2
 *  CREATE TABLE "Users" (
 * @@ -1228,3 +1226,3 @@ CREATE TABLE "Users" (
 *      "notificationDialogueMatch" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * -    "notificationNewDialogueChecks" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"daily","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationNewDialogueChecks" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "hideDialogueFacilitation" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "ea10555b6fef67efb7ab0cbbdfdb8772";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationNewDialogueChecks")
    await addField(db, Users, "notificationNewDialogueChecks")
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationNewDialogueChecks")
    await addField(db, Users, "notificationNewDialogueChecks")
  }
}
