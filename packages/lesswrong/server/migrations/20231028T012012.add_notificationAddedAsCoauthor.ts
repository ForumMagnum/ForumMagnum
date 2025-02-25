/**
 * Generated on 2023-10-28T01:20:12.226Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 609cdbf7e0..4fa244bab8 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5e28a08c9be1ba704a99a94dab5c4fae
 * -
 * --- Accepted on 2023-10-27T15:43:13.000Z by 20231027T154313.add_election_candidates_collection.ts
 * +-- Overall schema hash: ee9f40a8166012becef3bf0f5a9726b0
 *  
 * @@ -1061,3 +1059,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 28b52051adbbce3dec100b42997d7281
 * +-- Schema for "Users", hash: b27730e9f93ef74e21bbea8d6f188b80
 *  CREATE TABLE "Users" (
 * @@ -1151,2 +1149,3 @@ CREATE TABLE "Users" (
 *      "notificationPublishedDialogueMessages" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationAddedAsCoauthor" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "notificationDebateCommentsOnSubscribedPost" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"daily","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "ee9f40a8166012becef3bf0f5a9726b0";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'notificationAddedAsCoauthor');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'notificationAddedAsCoauthor');
}
