/**
 * Generated on 2023-02-06T17:44:49.307Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 343f1c362e..0e16a43c77 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7ea7cade23d0b233b794be743cd6ebaf
 * -
 * --- Accepted on 2023-02-01T15:58:39.000Z by 20230201T155839.add_importAsDraft_field.ts
 * +-- Overall schema hash: d2c9b9d8e8d4ae4b666795e3805a54da
 *  
 * @@ -799,3 +797,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: 99e2a511d3a98ab46e48361f8e052144
 * +-- Schema for "Tags", hash: 60359e66a4e1d457e87883b9265af539
 *  CREATE TABLE "Tags" (
 * @@ -803,2 +801,3 @@ CREATE TABLE "Tags" (
 *      "name" text,
 * +    "shortName" text,
 *      "slug" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "a7887d09050fb7d8f7117f498534d322";

import Tags from "../../server/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "shortName");
  await addField(db, Tags, "squareImageId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "shortName");
  await dropField(db, Tags, "squareImageId");
}
