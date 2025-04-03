/**
 * Generated on 2023-11-08T03:24:35.445Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index dc04b882e7..50aaec2ebe 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 060a65a6bb00ba7b0a4da5397165f444
 * -
 * --- Accepted on 2023-11-07T23:17:16.000Z by 20231107T231716.addElicitTables.ts
 * +-- Overall schema hash: 0d5156717800f18b4407edd0caa14def
 *  
 * @@ -1099,3 +1097,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: e8e6630d880bf48c1c4bd54c4b31e8d0
 * +-- Schema for "Users", hash: af068329774f52ec88fd989f515874db
 *  CREATE TABLE "Users" (
 * @@ -1192,2 +1190,3 @@ CREATE TABLE "Users" (
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
export const acceptsSchemaHash = "0d5156717800f18b4407edd0caa14def";

import Users from "../../server/collections/users/collection";
import {addField, dropField} from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationDialogueMatch");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationDialogueMatch");
}
