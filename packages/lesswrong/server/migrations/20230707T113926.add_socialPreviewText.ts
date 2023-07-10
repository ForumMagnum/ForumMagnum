/**
 * Generated on 2023-07-07T11:39:26.825Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 11b33ee26a..cc580c29cd 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d6b5c3a5a64a7eea065377c71e1b8acf
 * -
 * --- Accepted on 2023-06-20T12:08:43.000Z by 20230620T120843.add_noindex.ts
 * +-- Overall schema hash: 37d9d10ab5d20a058a054dc0abcaa843
 *  
 * @@ -533,3 +531,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 8fa0258cc54bd68af99fcb672494a94a
 * +-- Schema for "Posts", hash: 5210510d3c9b5ee297157b3635f75b04
 *  CREATE TABLE "Posts" (
 * @@ -606,2 +604,3 @@ CREATE TABLE "Posts" (
 *      "socialPreviewImageAutoUrl" text,
 * +    "socialPreviewText" text,
 *      "fmCrosspost" jsonb DEFAULT '{"isCrosspost":false}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "37d9d10ab5d20a058a054dc0abcaa843";

import Posts from "../../lib/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (!Posts.isPostgres()) return;

  await addField(db, Posts, "socialPreviewText");
}

export const down = async ({db}: MigrationContext) => {
  if (!Posts.isPostgres()) return;

  await dropField(db, Posts, "socialPreviewText");
}
