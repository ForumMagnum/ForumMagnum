/**
 * Generated on 2023-12-19T21:37:59.890Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 9db2ef08cb..41ebce31e2 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 592612513ed7bd3260014fe27c8ae328
 * -
 * --- Accepted on 2023-12-15T01:49:43.000Z by 20231215T014943.add_endedby_field_for_ckeditorusersessions.ts
 * +-- Overall schema hash: 4f18d5a0849cc239555c6263c3e20df4
 *  
 * @@ -1149,3 +1147,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 950f0a8caa012ac9e356a966b267f8d0
 * +-- Schema for "Users", hash: ca3b50eaaefc9ba0cccfc27e6ed8123e
 *  CREATE TABLE "Users" (
 * @@ -1252,2 +1250,3 @@ CREATE TABLE "Users" (
 *      "showRecommendedPartners" bool NOT NULL DEFAULT true,
 * +    "hideActiveDialogueUsers" bool NOT NULL DEFAULT false,
 *      "karmaChangeNotifierSettings" jsonb NOT NULL DEFAULT '{"updateFrequency":"daily","timeOfDayGMT":11,"dayOfWeekGMT":"Saturday","showNegativeKarma":false}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4f18d5a0849cc239555c6263c3e20df4";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideActiveDialogueUsers")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideActiveDialogueUsers")
}
