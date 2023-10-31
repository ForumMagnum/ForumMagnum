
/**
 * Generated on 2023-10-30T23:34:05.838Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 609cdbf7e0..57c8d1e04a 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5e28a08c9be1ba704a99a94dab5c4fae
 * -
 * --- Accepted on 2023-10-27T15:43:13.000Z by 20231027T154313.add_election_candidates_collection.ts
 * +-- Overall schema hash: 8906155f2e34f2b130266760ca58b508
 *  
 * @@ -1061,3 +1059,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 28b52051adbbce3dec100b42997d7281
 * +-- Schema for "Users", hash: 5ba2636d560ee7de9037187bab001099
 *  CREATE TABLE "Users" (
 * @@ -1154,2 +1152,3 @@ CREATE TABLE "Users" (
 *      "hideDialogueFacilitation" bool NOT NULL DEFAULT false,
 * +    "optedInToDialogueFacilitation" bool NOT NULL DEFAULT false,
 *      "karmaChangeNotifierSettings" jsonb DEFAULT '{"updateFrequency":"daily","timeOfDayGMT":11,"dayOfWeekGMT":"Saturday","showNegativeKarma":false}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "2e14526f8bb387a6f320a68329fcb9e0";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "optedInToDialogueFacilitation");
   }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "optedInToDialogueFacilitation");
  }
}
