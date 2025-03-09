/**
 * Generated on 2024-05-08T10:55:44.121Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 362a00944c..8fab721f53 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5cfcede474784a16b714db78a9f550d0
 * -
 * --- Accepted on 2024-05-01T13:57:58.000Z by 20240501T135758.set_not_null_clientId.ts
 * +-- Overall schema hash: 2b717580ae36a1a7e24c5a806f1806ac
 *  
 * @@ -756,3 +754,3 @@ CREATE TABLE "PostViews" (
 *  
 * --- Schema for "Posts", hash: 684ee7b6197d186baa38b4ea81b728c2
 * +-- Schema for "Posts", hash: 586c1d2e7dfcafe761c454ecad31889b
 *  CREATE TABLE "Posts" (
 * @@ -910,2 +908,3 @@ CREATE TABLE "Posts" (
 *      "agentFoundationsId" text,
 * +    "swrCachingEnabled" bool NOT NULL DEFAULT false,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4a1206bafcc5c4d63fca651ad906d213";

import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "swrCachingEnabled");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "swrCachingEnabled");
}
