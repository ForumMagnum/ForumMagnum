/**
 * Generated on 2023-12-20T21:25:20.939Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index cf29788ddd..c69460bfb5 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4f18d5a0849cc239555c6263c3e20df4
 * -
 * --- Accepted on 2023-12-19T21:37:59.000Z by 20231219T213759.add_hideactivedialogueusers_field.ts
 * +-- Overall schema hash: 4a1a03e638557cba881d59cb63b0ed02
 *  
 * @@ -1149,7 +1147,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * -<<<<<<< HEAD
 * --- Schema for "Users", hash: 424995d05e120393b3d73bec4d5d11e3
 * -=======
 * --- Schema for "Users", hash: ca3b50eaaefc9ba0cccfc27e6ed8123e
 * ->>>>>>> master
 * +-- Schema for "Users", hash: 2c8c444dccc02c6666a354768baf3164
 *  CREATE TABLE "Users" (
 * @@ -1561 +1555,2 @@ CREATE OR REPLACE FUNCTION fm_comment_confidence(
 *    ;
 * +
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 */
export const acceptsSchemaHash = "4a1a03e638557cba881d59cb63b0ed02";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationYourTurnMatchForm")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationYourTurnMatchForm")
}
