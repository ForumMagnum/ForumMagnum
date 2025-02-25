/**
 * Generated on 2024-01-14T01:41:18.515Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/habryka/Lightcone/ForumMagnum/schema/accepted_schema.sql b/Users/habryka/Lightcone/ForumMagnum/schema/schema_to_accept.sql
 * index 8d211efc9f..4d7f394186 100644
 * --- a/Users/habryka/Lightcone/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/habryka/Lightcone/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2431de6961ce37514d54a17a5ca14adc
 * -
 * --- Accepted on 2024-01-11T00:33:12.000Z by 20240111T003312.update_notificationNewDialogueChecks_default.ts
 * +-- Overall schema hash: ab5cd3028069be1418fb1e7229510a52
 *  
 * @@ -1149,3 +1147,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 78fe52497eac0560e84f7119e5dcf8f0
 * +-- Schema for "Users", hash: 2c4016a52d7bdd1351c493993244b59a
 *  CREATE TABLE "Users" (
 * @@ -1363,2 +1361,3 @@ CREATE TABLE "Users" (
 *      "givingSeason2023VotedFlair" bool NOT NULL DEFAULT false,
 * +    "hideSunshineSidebar" bool NOT NULL DEFAULT false,
 *      "wrapped2023Viewed" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "ab5cd3028069be1418fb1e7229510a52";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideSunshineSidebar");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideSunshineSidebar");
}
