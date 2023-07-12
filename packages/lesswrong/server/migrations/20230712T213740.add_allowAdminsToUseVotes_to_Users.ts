/**
 * Generated on 2023-07-12T21:37:40.688Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 11b33ee26a..22a06bc290 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d6b5c3a5a64a7eea065377c71e1b8acf
 * -
 * --- Accepted on 2023-06-20T12:08:43.000Z by 20230620T120843.add_noindex.ts
 * +-- Overall schema hash: fe7139368423b05281e1da72ae53e965
 *  
 * @@ -999,3 +997,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: d64da8350def59cbeb640f264a7b09a4
 * +-- Schema for "Users", hash: f964a9b178e936813e65931ad6369cd8
 *  CREATE TABLE "Users" (
 * @@ -1186,2 +1184,3 @@ CREATE TABLE "Users" (
 *      "allowDatadogSessionReplay" bool DEFAULT false,
 * +    "allowAdminsToUseVotes" bool DEFAULT false,
 *      "afPostCount" double precision DEFAULT 0,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "fe7139368423b05281e1da72ae53e965";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";


export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "allowAdminsToUseVotes");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "allowAdminsToUseVotes");
  }
}
