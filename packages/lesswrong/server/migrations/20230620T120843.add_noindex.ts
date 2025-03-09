/**
 * Generated on 2023-06-20T12:08:43.990Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index a66567b398..c9018f8fd7 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8f9b37b6b8213a24c21dba39e77f7bbb
 * -
 * --- Accepted on 2023-06-09T10:00:00.000Z by 20230609T100000.add_PageCache.ts
 * +-- Overall schema hash: b17bf833438d0e555d5a282a3f96b834
 *  
 * @@ -867,3 +865,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: 66c84c8a02ec236dcf00125ab99cc0ce
 * +-- Schema for "Tags", hash: 9f3bd27e911d2c05b124f2a98eeb70fd
 *  CREATE TABLE "Tags" (
 * @@ -910,2 +908,3 @@ CREATE TABLE "Tags" (
 *      "autoTagPrompt" text DEFAULT '',
 * +    "noindex" bool DEFAULT false,
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
export const acceptsSchemaHash = "d6b5c3a5a64a7eea065377c71e1b8acf";

import Tags from "../../server/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "noindex");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "noindex");
}
