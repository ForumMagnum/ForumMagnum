/**
 * Generated on 2023-11-28T00:23:41.006Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index ae273e25f1..30771059f0 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2e28d7576d143428c88b6c5a8ece4690
 * -
 * --- Accepted on 2023-11-24T20:09:25.000Z by 20231124T200925.move_on_connect_queries_into_migration.ts
 * +-- Overall schema hash: b7acd87acefd755f47f0a02cda2fcc07
 *  
 * @@ -1118,3 +1116,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 35f8ce70829fe6ccf6d005353b2d9439
 * +-- Schema for "Users", hash: 82b73b743a883191481c33ffcb35e08c
 *  CREATE TABLE "Users" (
 * @@ -1216,2 +1214,6 @@ CREATE TABLE "Users" (
 *      "optedInToDialogueFacilitation" bool NOT NULL DEFAULT false,
 * +    "showDialoguesList" bool NOT NULL DEFAULT true,
 * +    "showMyDialogues" bool NOT NULL DEFAULT true,
 * +    "showMatches" bool NOT NULL DEFAULT true,
 * +    "showRecommendedPartners" bool NOT NULL DEFAULT true,
 *      "karmaChangeNotifierSettings" jsonb DEFAULT '{"updateFrequency":"daily","timeOfDayGMT":11,"dayOfWeekGMT":"Saturday","showNegativeKarma":false}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X]] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "b7acd87acefd755f47f0a02cda2fcc07";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";


export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
   await addField(db, Users, "showDialoguesList");
   await addField(db, Users, "showMyDialogues");
   await addField(db, Users, "showMatches");
   await addField(db, Users, "showRecommendedPartners");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "showDialoguesList");
    await dropField(db, Users, "showMyDialogues");
    await dropField(db, Users, "showMatches");
    await dropField(db, Users, "showRecommendedPartners");
  }
}
