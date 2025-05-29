/**
 * Generated on 2023-03-01T12:55:11.480Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 1e7ead6503..ebd63eed08 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c938b8b04e3c61dec2f0b640b6cb0b4d
 * -
 * --- Accepted on 2023-02-23T11:56:02.000Z by 20230223T115602.DebouncerEvents_pendingEvents_string_array.ts
 * +-- Overall schema hash: 4f068c9deffbe10d8828def55e70e965
 *  
 * @@ -810,3 +808,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: 9ddba864a69625328eb4ff989b850303
 * +-- Schema for "Tags", hash: 66c84c8a02ec236dcf00125ab99cc0ce
 *  CREATE TABLE "Tags" (
 * @@ -815,2 +813,3 @@ CREATE TABLE "Tags" (
 *      "shortName" text,
 * +    "subtitle" text,
 *      "slug" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "cc99890ebfba1e45ded25456d68f852b";

import Tags from "../../server/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "subtitle");
  await db.any(`UPDATE "Users" SET "subforumPreferredLayout" = 'card' WHERE "subforumPreferredLayout" = 'feed';`)
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "subtitle");
  await db.any(`UPDATE "Users" SET "subforumPreferredLayout" = 'feed' WHERE "subforumPreferredLayout" = 'card';`)
}
