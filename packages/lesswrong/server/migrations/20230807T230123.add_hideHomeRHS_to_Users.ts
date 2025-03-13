/**
 * Generated on 2023-08-07T23:01:23.339Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 25d15814a6..3befd5d78d 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: e7d890dadc54453234507be13698b7b7
 * -
 * --- Accepted on 2023-07-27T12:20:27.000Z by 20230727T122027.add_isPostType_field.ts
 * +-- Overall schema hash: d7266200db426f47cd1ba7abcc6a6db7
 *  
 * @@ -1003,3 +1001,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: d64da8350def59cbeb640f264a7b09a4
 * +-- Schema for "Users", hash: 6af340dca1e5f32d30449abd73726b6f
 *  CREATE TABLE "Users" (
 * @@ -1101,2 +1099,3 @@ CREATE TABLE "Users" (
 *      "hideMeetupsPoke" bool DEFAULT false,
 * +    "hideHomeRHS" bool DEFAULT false,
 *      "frontpagePostCount" double precision DEFAULT 0,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "d7266200db426f47cd1ba7abcc6a6db7";

import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideHomeRHS");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideHomeRHS");
}
