/**
 * Generated on 2024-02-12T15:42:51.529Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 7b8cf3620c..c6046eeb34 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 44cc1cc66be79573b597f5f1168df8ec
 * -
 * --- Accepted on 2024-01-31T23:05:52.000Z by 20240131T230552.add_ManifoldProbabilitiesCaches_table_and_annual_review_fields_to_Posts.ts
 * +-- Overall schema hash: dc6ba9da99159ebea8c70ee2ca08d7ab
 *  
 * @@ -938,3 +936,3 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "Revisions", hash: 74919ae8bdbb0a368ec1a36d5b0a86ff
 * +-- Schema for "Revisions", hash: 4df2b8cb0da0ae648eea256d967099c8
 *  CREATE TABLE "Revisions" (
 * @@ -955,2 +953,3 @@ CREATE TABLE "Revisions" (
 *      "changeMetrics" jsonb NOT NULL,
 * +    "googleDocMetadata" jsonb,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * @@ -1192,3 +1191,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 5cb5ae009dbd81546cd260d4d7228f7d
 * +-- Schema for "Users", hash: 6d7e6f81d5a3146fce465995ed76393e
 *  CREATE TABLE "Users" (
 * @@ -1405,2 +1404,3 @@ CREATE TABLE "Users" (
 *      "wrapped2023Viewed" bool NOT NULL DEFAULT false,
 * +    "linkedGoogleRefreshToken" text,
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
// export const acceptsSchemaHash = "dc6ba9da99159ebea8c70ee2ca08d7ab";

import Revisions from "../../lib/collections/revisions/collection"
import { addField, dropField } from "./meta/utils"

// TODO combine with previous migration
export const up = async ({db}: MigrationContext) => {
  await addField(db, Revisions, "googleDocMetadata")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Revisions, "googleDocMetadata")
}
