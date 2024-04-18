import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Generated on 2024-04-18T01:06:16.100Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 7c9d93ea3c..a1551394a2 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: b2d46df0cf4693fc419953f2fbe9a0cc
 * -
 * --- Accepted on 2024-04-10T22:52:50.000Z by 20240410T225250.add_lastUpdated_to_Sequences.ts
 * +-- Overall schema hash: e5deb4ffab14618de09fd319510ce3fa
 *  
 * @@ -1337,3 +1335,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: c986a21b18fc4f4e0b7ac2135776aa61
 * +-- Schema for "Users", hash: aeee596b35e552ca7e43fa4b666d3dcb
 *  CREATE TABLE "Users" (
 * @@ -1377,2 +1375,3 @@ CREATE TABLE "Users" (
 *      "currentFrontpageFilter" text,
 * +    "frontpageSelectedTab" text,
 *      "frontpageFilterSettings" jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "e5deb4ffab14618de09fd319510ce3fa";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "frontpageSelectedTab")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "frontpageSelectedTab")
}
