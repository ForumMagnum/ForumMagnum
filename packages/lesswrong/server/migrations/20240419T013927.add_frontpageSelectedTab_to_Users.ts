/**
 * Generated on 2024-04-19T01:39:27.249Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 039846b69b..150665a6bb 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8365aace030196807258e6ab633a5466
 * -
 * --- Accepted on 2024-04-16T15:17:09.000Z by 20240416T151709.drop_Users_wrapped2023Viewed_experiencedIn_interestedIn.ts
 * +-- Overall schema hash: 082b143a17fca4e8ba5edd982a645837
 *  
 * @@ -1337,3 +1335,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 1162871a0691103675338300311a392e
 * +-- Schema for "Users", hash: 61d69bc42d7b01f82eb93ede5da593fe
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
export const acceptsSchemaHash = "082b143a17fca4e8ba5edd982a645837";

import Users from "../../server/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "frontpageSelectedTab")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "frontpageSelectedTab")
}
