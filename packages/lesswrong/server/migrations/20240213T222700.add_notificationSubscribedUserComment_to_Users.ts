/**
 * Generated on 2024-02-13T22:27:00.232Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 71d6c180b1..38ef8172c3 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1aeedd5dfed78362382d387f2f2bce84
 * -
 * --- Accepted on 2024-02-06T04:16:51.000Z by 20240206T041651.add_UserJobAds_collection.ts
 * +-- Overall schema hash: 92b57599e36ee19757a1e763216509c5
 *  
 * @@ -1204,3 +1202,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 83f6cae9e5a8e9e8c865f30e5d6030f0
 * +-- Schema for "Users", hash: 3a8013cc70ef2d83d1fd3ec8c97315ce
 *  CREATE TABLE "Users" (
 * @@ -1280,2 +1278,3 @@ CREATE TABLE "Users" (
 *      "notificationSubscribedUserPost" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationSubscribedUserComment" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "notificationPostsInGroups" jsonb NOT NULL DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "92b57599e36ee19757a1e763216509c5";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationSubscribedUserComment")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationSubscribedUserComment")
}
