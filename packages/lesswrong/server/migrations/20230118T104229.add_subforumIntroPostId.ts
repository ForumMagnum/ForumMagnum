/**
 * Generated on 2023-01-12T15:13:05.247Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 262617ce5a..48bed44d69 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ea71916ffaa87ae0a21302ce831261e6
 * -
 * --- Accepted on 2022-12-30T18:11:10.000Z by 20221230T181110.fix_editable_fields.ts
 * +-- Overall schema hash: d0d774d029dff33d300b1f8fc8a421e5
 *  
 * @@ -785,3 +783,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: 5eaf702c518267a7a5f02b17a72f1cdf
 * +-- Schema for "Tags", hash: 15ca0e7b4375d6d3a581c0a452cc293d
 *  CREATE TABLE "Tags" (
 * @@ -820,2 +818,3 @@ CREATE TABLE "Tags" (
 *      "subforumModeratorIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
 * +    "subforumIntroPostId" varchar(27),
 *      "parentTagId" varchar(27),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "d92682d72d3bee6deb63b3b6419e027c";

import Tags from "../../server/collections/tags/collection"
import UserTagRels from "../../server/collections/userTagRels/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "subforumIntroPostId");
  await addField(db, UserTagRels, "subforumHideIntroPost");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "subforumIntroPostId");
  await dropField(db, UserTagRels, "subforumHideIntroPost");
}
