/**
 * Generated on 2022-10-20T20:43:21.077Z
 * `yarn checkschema` detected the following schema changes:
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 280b958897..3df31def50 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -1,3 +1,3 @@
 * --- Accepted on 2022-10-18T12:00:00.000Zby 20221018T120000.test.ts
 * --- Overall schema hash: f35e3a55fef9bc8ce69b41f9f8358f80
 * +-- Accepted on 2022-10-18T12:00:00.000Z by 20221018T120000.test.ts
 * +-- Overall schema hash: 654f4ac9cac8036a673df6776b5bc243
 *  
 * @@ -712,3 +712,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 9de9a90f9bcc664058f718184416b3ed
 * +-- Schema for "Users", hash: dd0e0a33d17dd480d34e0785fcfe60b8
 *  CREATE TABLE "Users" (
 * @@ -718,2 +718,3 @@ CREATE TABLE "Users" (
 *      "isAdmin" bool,
 * +    "isNotAdmin" bool,
 *      "profile" jsonb,
 * 
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn checkschema` again to update the accepted schema hash
 */
export const acceptsSchemaHash = "654f4ac9cac8036a673df6776b5bc243";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
