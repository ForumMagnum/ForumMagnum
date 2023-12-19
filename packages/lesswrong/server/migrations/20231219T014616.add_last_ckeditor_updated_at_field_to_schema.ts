/**
 * Generated on 2023-12-19T01:46:16.710Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 9db2ef08cb..70e93d85aa 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 592612513ed7bd3260014fe27c8ae328
 * -
 * --- Accepted on 2023-12-15T01:49:43.000Z by 20231215T014943.add_endedby_field_for_ckeditorusersessions.ts
 * +-- Overall schema hash: 0d7b87ee6f736f9017c745560f630a50
 *  
 * @@ -658,3 +656,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 34f525156e944ed443d26e4b60b443e9
 * +-- Schema for "Posts", hash: 17176d26bbf3d964fcd74aa0b356e600
 *  CREATE TABLE "Posts" (
 * @@ -663,2 +661,3 @@ CREATE TABLE "Posts" (
 *      "modifiedAt" timestamptz,
 * +    "lastCkEditorUpdatedAt" timestamptz,
 *      "url" varchar(500),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "0d7b87ee6f736f9017c745560f630a50";

import { Posts } from "../../lib/collections/posts/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "lastCkEditorUpdatedAt")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "lastCkEditorUpdatedAt")
}
