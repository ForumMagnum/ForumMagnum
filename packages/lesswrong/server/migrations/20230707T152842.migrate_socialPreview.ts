/**
 * Generated on 2023-07-07T15:28:42.020Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 11b33ee26a..fefa535cb1 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d6b5c3a5a64a7eea065377c71e1b8acf
 * -
 * --- Accepted on 2023-06-20T12:08:43.000Z by 20230620T120843.add_noindex.ts
 * +-- Overall schema hash: 1086244fc2125ed27d1981cc3f4d4a4c
 *  
 * @@ -533,3 +531,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 8fa0258cc54bd68af99fcb672494a94a
 * +-- Schema for "Posts", hash: d6ab37759bf2c33e835c93a2df673465
 *  CREATE TABLE "Posts" (
 * @@ -606,2 +604,4 @@ CREATE TABLE "Posts" (
 *      "socialPreviewImageAutoUrl" text,
 * +    "socialPreviewText" text,
 * +    "socialPreview" jsonb,
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
export const acceptsSchemaHash = "4b4e757dda0d5609834188196a6c1742";

import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "socialPreview");
  // migrate socialPreviewImageId to socialPreview = {imageId: socialPreviewImageId}
  await db.any(`
    UPDATE "Posts"
    SET "socialPreview" = jsonb_build_object('imageId', "socialPreviewImageId")
    WHERE "socialPreviewImageId" IS NOT NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "socialPreview");
}
