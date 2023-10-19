/**
 * Generated on 2023-10-19T15:04:21.325Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 614b2f2bb4..92e5086be2 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 881c509060130982ab7f20a92a5c9602
 * -
 * --- Accepted on 2023-10-09T10:16:21.000Z by 20231009T101621.add_wasEverUndrafted_to_posts.ts
 * +-- Overall schema hash: 21908b5badcbed77574b48e9b414f72b
 *  
 * @@ -1036,3 +1034,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 26a0b4ee3c87b967a8fb38ba798bf45b
 * +-- Schema for "Users", hash: 8f2ad99ccb194cd328b4cf24f2066315
 *  CREATE TABLE "Users" (
 * @@ -1124,2 +1122,3 @@ CREATE TABLE "Users" (
 *      "notificationNewMention" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationNewReaction" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "notificationDialogueMessages" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "21908b5badcbed77574b48e9b414f72b";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) await addField(db, Users, 'notificationNewReaction')
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) await dropField(db, Users, 'notificationNewReaction')
}
