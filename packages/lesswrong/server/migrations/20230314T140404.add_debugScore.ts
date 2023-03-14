/**
 * Generated on 2023-03-14T14:04:04.607Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 1e7ead6503..3e04603f45 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c938b8b04e3c61dec2f0b640b6cb0b4d
 * -
 * --- Accepted on 2023-02-23T11:56:02.000Z by 20230223T115602.DebouncerEvents_pendingEvents_string_array.ts
 * +-- Overall schema hash: 0b5520943a1ddd1614b1724d9cd68aac
 *  
 * @@ -458,3 +456,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: fa147c255ec4cd729e027b5554be0b54
 * +-- Schema for "Posts", hash: 73528a4700da37d6764a451e27b5d33a
 *  CREATE TABLE "Posts" (
 * @@ -597,2 +595,3 @@ CREATE TABLE "Posts" (
 *      "agentFoundationsId" text,
 * +    "debugScore" double precision DEFAULT 0,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "0b5520943a1ddd1614b1724d9cd68aac";

import Posts from "../../lib/collections/posts/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Posts.isPostgres()) return
  
  await addField(db, Posts, "debugScore")
}

export const down = async ({db}: MigrationContext) => {
  if (!Posts.isPostgres()) return
  
  await dropField(db, Posts, "debugScore")
}
