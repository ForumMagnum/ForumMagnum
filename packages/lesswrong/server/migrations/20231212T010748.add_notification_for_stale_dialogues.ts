/**
 * Generated on 2023-12-12T01:07:48.214Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index a060619d8c..a32f33bdd0 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 989958afb8a5cef47f6f8bd33d5a499f
 * -
 * --- Accepted on 2023-12-08T02:17:26.000Z by 20231208T021726.add_soft_delete_to_forms.ts
 * +-- Overall schema hash: f0a95e26ea7eb2c3c375d53779e209a8
 *  
 * @@ -1137,3 +1135,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 950f0a8caa012ac9e356a966b267f8d0
 * +-- Schema for "Users", hash: 4f51c4931eafce709e409f1ce0c694ef
 *  CREATE TABLE "Users" (
 * @@ -1233,2 +1231,3 @@ CREATE TABLE "Users" (
 *      "notificationNewDialogueChecks" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationDialogueHelperBotPing" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "hideDialogueFacilitation" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f0a95e26ea7eb2c3c375d53779e209a8";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "notificationDialogueHelperBotPing")
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationDialogueHelperBotPing")
  }
}
