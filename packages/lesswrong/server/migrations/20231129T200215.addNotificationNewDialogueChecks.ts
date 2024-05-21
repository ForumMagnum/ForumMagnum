/**
 * Generated on 2023-11-29T20:02:15.475Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index ce1e629da8..a2a3410ca2 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5cb40349b3ff94014c31fb0418ffa6ea
 * -
 * --- Accepted on 2023-11-29T19:00:47.000Z by 20231129T190047.add_four_fields_for_frontpage_dialogue_widget_customisation.ts
 * +-- Overall schema hash: 6ee0467b3cdea6d954c14e9bee545c42
 *  
 * @@ -1133,3 +1131,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: a22133351267b7929fc15b858b0d5748
 * +-- Schema for "Users", hash: 698b626d9959c4ee04993fea28a5263d
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
export const acceptsSchemaHash = "6ee0467b3cdea6d954c14e9bee545c42";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationNewDialogueChecks")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationNewDialogueChecks")
}
