/**
 * Generated on 2023-01-25T21:29:26.241Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * index d49b62e3c5..acc2be5e73 100644
 * --- a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f167b9a94ae9eebe159267d6ca82d3a4
 * -
 * --- Accepted on 2023-01-24T21:05:13.000Z by 20230124T210513.spotlight_new_fields.ts
 * +-- Overall schema hash: e5c970b99c1cde3aeba7157d0b65d946
 *  
 * @@ -863,3 +861,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: ba42221cd8e6c8924c8531df2692d80e
 * +-- Schema for "Users", hash: 7e2be9adccdade87eca6ee39b546376f
 *  CREATE TABLE "Users" (
 * @@ -983,2 +981,3 @@ CREATE TABLE "Users" (
 *      "bigDownvoteCount" double precision,
 * +    "usersContactedBeforeReview" text[],
 *      "fullName" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable if you wish
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "e5c970b99c1cde3aeba7157d0b65d946";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) {
    return
  }
  
  await addField(db, Users, "usersContactedBeforeReview")
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) {
    return
  }
  
  await dropField(db, Users, "usersContactedBeforeReview")
}
