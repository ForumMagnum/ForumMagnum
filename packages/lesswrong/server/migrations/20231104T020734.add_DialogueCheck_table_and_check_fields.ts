/**
 * Generated on 2023-11-04T02:07:34.143Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 63674a4dbe..558fe84823 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,11 +4,3 @@
 *  --
 * -<<<<<<< HEAD
 * --- Overall schema hash: b669c5d8be042559b7862036de5bb3b4
 * -
 * --- Accepted on 2023-10-31T23:02:23.000Z by 20231031T230223.add_dialogue_reveal_checks_to_admin.ts
 * -=======
 * --- Overall schema hash: e02a31666a33984e158e485e3a0c5f30
 * -
 * --- Accepted on 2023-11-03T20:20:08.000Z by 20231103T202008.originalDialogueIdForShortform.ts
 * ->>>>>>> origin/master
 * +-- Overall schema hash: f5e4a3d5459008e1e5f5e83555a849b1
 *  
 * @@ -1082,7 +1074,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * -<<<<<<< HEAD
 * --- Schema for "Users", hash: d808bc3d26b57dcc052e7be6e843ae1d
 * -=======
 * --- Schema for "Users", hash: 50f4feeb1374733e404020c3513d1892
 * ->>>>>>> origin/master
 * +-- Schema for "Users", hash: e8e6630d880bf48c1c4bd54c4b31e8d0
 *  CREATE TABLE "Users" (
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f5e4a3d5459008e1e5f5e83555a849b1";

import Users from "../../lib/collections/users/collection";
import {addField, createTable, dropField, dropTable} from "./meta/utils";
import DialogueCheck from "../../lib/collections/dialogueChecks/collection";

// This was originally 3 migrations from our PR, but after catching up with master, we're combining them into one

export const up = async ({db}: MigrationContext) => {
  await createTable(db, DialogueCheck);
  await addField(db, Users, "optedInToDialogueFacilitation");
  await addField(db, Users, "revealChecksToAdmins");
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DialogueCheck);
  await dropField(db, Users, "optedInToDialogueFacilitation");
  await dropField(db, Users, "revealChecksToAdmins");
}
