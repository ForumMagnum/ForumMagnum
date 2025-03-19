/**
 * Generated on 2023-12-15T01:49:43.720Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 6d22d77e53..a212e69f70 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: e30b5ca4f4989161f627585b747ee83e
 * -
 * --- Accepted on 2023-12-12T22:35:11.000Z by 20231212T223511.add_table_for_ckeditorusersessions.ts
 * +-- Overall schema hash: 592612513ed7bd3260014fe27c8ae328
 *  
 * @@ -81,3 +79,3 @@ CREATE TABLE "Chapters" (
 *  
 * --- Schema for "CkEditorUserSessions", hash: b9eaf9c72e9640972611847068931528
 * +-- Schema for "CkEditorUserSessions", hash: c2661309fbf1ff8da6742725ec19ffdc
 *  CREATE TABLE "CkEditorUserSessions" (
 * @@ -87,2 +85,3 @@ CREATE TABLE "CkEditorUserSessions" (
 *      "endedAt" timestamptz,
 * +    "endedBy" text,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "592612513ed7bd3260014fe27c8ae328";

import CkEditorUserSessions from "../../server/collections/ckEditorUserSessions/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, CkEditorUserSessions, "endedBy")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, CkEditorUserSessions, "endedBy")
}
