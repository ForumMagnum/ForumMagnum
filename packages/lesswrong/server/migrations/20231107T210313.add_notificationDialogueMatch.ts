/**
 * Generated on 2023-11-07T21:03:13.478Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 4e7c77e257..ef31d5f81b 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f5e4a3d5459008e1e5f5e83555a849b1
 * -
 * --- Accepted on 2023-11-04T02:07:34.000Z by 20231104T020734.add_DialogueCheck_table_and_check_fields.ts
 * +-- Overall schema hash: cf6b466524b616c36b629f29b80a65d2
 *  
 * @@ -1076,3 +1074,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: e8e6630d880bf48c1c4bd54c4b31e8d0
 * +-- Schema for "Users", hash: af068329774f52ec88fd989f515874db
 *  CREATE TABLE "Users" (
 * @@ -1169,2 +1167,3 @@ CREATE TABLE "Users" (
 *      "notificationDebateReplies" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationDialogueMatch" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "hideDialogueFacilitation" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */

export const acceptsSchemaHash = "cf6b466524b616c36b629f29b80a65d2";

import Users from "../../lib/collections/users/collection";
import {addField, dropField} from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "notificationDialogueMatch");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationDialogueMatch");
  }
}
