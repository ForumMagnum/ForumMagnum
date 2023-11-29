/**
 * Generated on 2023-11-29T01:12:36.953Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index 1a80166b28..8e2cb4845b 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7db476f93913b50f646a44166768ced6
 * -
 * --- Accepted on 2023-11-28T15:23:04.000Z by 20231128T152304.add_ElectionVotes.ts
 * +-- Overall schema hash: f0c8207e63f19948cbc99d609bf283b2
 *  
 * @@ -1133,3 +1131,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 35f8ce70829fe6ccf6d005353b2d9439
 * +-- Schema for "Users", hash: fc476347f8389e9d90ee4f78e8a13061
 *  CREATE TABLE "Users" (
 * @@ -1228,2 +1226,3 @@ CREATE TABLE "Users" (
 *      "notificationDialogueMatch" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationNewDialogueChecks" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"daily","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
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
export const acceptsSchemaHash = "f0c8207e63f19948cbc99d609bf283b2";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "notificationNewDialogueChecks");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationNewDialogueChecks");
  }
}
