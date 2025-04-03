/**
 * Generated on 2022-12-22T10:44:17.149Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 4446efb354..6a6ed42185 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9ff9e6371051f8d49cac5770b07dc0d8
 * -
 * --- Accepted on 2022-12-13T18:11:44.000Z by 20221213T181144.fix_float_precision.ts
 * +-- Overall schema hash: cb1d2762fdb5ec6a0e0b39181fa61912
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 566d3080d735c54143f4dd5100958697
 * +-- Schema for "Comments", hash: c5e0b25f455d66728a119c857c4d65b6
 *  CREATE TABLE "Comments" (
 * @@ -155,2 +153,3 @@ CREATE TABLE "Comments" (
 *      "isPinnedOnProfile" bool DEFAULT false,
 * +    "title" varchar(500),
 *      "af" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "afc7cd96d9085ca54d2a50765d02338f";

import Comments from "../../server/collections/comments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, "title");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "title");
}
