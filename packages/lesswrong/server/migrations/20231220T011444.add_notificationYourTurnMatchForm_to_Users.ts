/**
 * Generated on 2023-12-20T01:14:44.147Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 9db2ef08cb..1efcc82f51 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 592612513ed7bd3260014fe27c8ae328
 * -
 * --- Accepted on 2023-12-15T01:49:43.000Z by 20231215T014943.add_endedby_field_for_ckeditorusersessions.ts
 * +-- Overall schema hash: 3c34c84edbc1f9b550daca4729602428
 *  
 * @@ -1149,3 +1147,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 950f0a8caa012ac9e356a966b267f8d0
 * +-- Schema for "Users", hash: 424995d05e120393b3d73bec4d5d11e3
 *  CREATE TABLE "Users" (
 * @@ -1245,2 +1243,3 @@ CREATE TABLE "Users" (
 *      "notificationNewDialogueChecks" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationYourTurnMatchForm" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
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
export const acceptsSchemaHash = "3c34c84edbc1f9b550daca4729602428";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationYourTurnMatchForm")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationYourTurnMatchForm")
}
