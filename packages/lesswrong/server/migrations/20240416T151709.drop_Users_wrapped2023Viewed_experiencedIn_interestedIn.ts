import Users from "../../server/collections/users/collection";
import { ArrayType, BoolType, StringType } from "../../server/sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils";

/**
 * Generated on 2024-04-16T15:17:09.648Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 7c9d93ea3c..b81551fe82 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: b2d46df0cf4693fc419953f2fbe9a0cc
 * -
 * --- Accepted on 2024-04-10T22:52:50.000Z by 20240410T225250.add_lastUpdated_to_Sequences.ts
 * +-- Overall schema hash: 8365aace030196807258e6ab633a5466
 *  
 * @@ -1337,3 +1335,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: c986a21b18fc4f4e0b7ac2135776aa61
 * +-- Schema for "Users", hash: 1162871a0691103675338300311a392e
 *  CREATE TABLE "Users" (
 * @@ -1541,4 +1539,2 @@ CREATE TABLE "Users" (
 *      "hideJobAdUntil" timestamptz,
 * -    "experiencedIn" text[],
 * -    "interestedIn" text[],
 *      "allowDatadogSessionReplay" bool NOT NULL DEFAULT false,
 * @@ -1553,3 +1549,2 @@ CREATE TABLE "Users" (
 *      "inactiveSurveyEmailSentAt" timestamptz,
 * -    "wrapped2023Viewed" bool NOT NULL DEFAULT false,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "8365aace030196807258e6ab633a5466";

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "experiencedIn")
  await dropRemovedField(db, Users, "interestedIn")
  await dropRemovedField(db, Users, "wrapped2023Viewed")
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "experiencedIn", new ArrayType(new StringType()))
  await addRemovedField(db, Users, "interestedIn", new ArrayType(new StringType()))
  await addRemovedField(db, Users, "wrapped2023Viewed", new BoolType())
}
