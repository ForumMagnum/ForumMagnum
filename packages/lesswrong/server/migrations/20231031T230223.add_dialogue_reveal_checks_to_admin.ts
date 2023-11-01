/**
 * Generated on 2023-10-31T23:02:23.713Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 34dd93c5bc..341d495389 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2e0ba043f057e511aa882172641097b4
 * -
 * --- Accepted on 2023-10-27T21:32:16.000Z by 20231027T213216.add_dialoguecheck_collection.ts
 * +-- Overall schema hash: b669c5d8be042559b7862036de5bb3b4
 *  
 * @@ -1073,3 +1071,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 5ba2636d560ee7de9037187bab001099
 * +-- Schema for "Users", hash: d808bc3d26b57dcc052e7be6e843ae1d
 *  CREATE TABLE "Users" (
 * @@ -1166,2 +1164,3 @@ CREATE TABLE "Users" (
 *      "hideDialogueFacilitation" bool NOT NULL DEFAULT false,
 * +    "revealChecksToAdmins" boaddol NOT NULL DEFAULT false,
 *      "optedInToDialogueFacilitation" bool NOT NULL DEFAULT false,
 * @@ -1306 +1305,2 @@ CREATE TABLE "Votes" (
 *  );
 * +
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "b669c5d8be042559b7862036de5bb3b4";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "revealChecksToAdmins");
   }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "revealChecksToAdmins");
  }
}
