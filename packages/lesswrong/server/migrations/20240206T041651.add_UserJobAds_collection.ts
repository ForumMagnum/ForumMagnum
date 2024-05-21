/**
 * Generated on 2024-02-06T04:16:51.364Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 7b8cf3620c..1221ada2f4 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 44cc1cc66be79573b597f5f1168df8ec
 * -
 * --- Accepted on 2024-01-31T23:05:52.000Z by 20240131T230552.add_ManifoldProbabilitiesCaches_table_and_annual_review_fields_to_Posts.ts
 * +-- Overall schema hash: 1aeedd5dfed78362382d387f2f2bce84
 *  
 * @@ -1153,2 +1151,14 @@ CREATE TABLE "UserActivities" (
 *  
 * +-- Schema for "UserJobAds", hash: cbe262a3b5b91e45d97e57a62c0e7b6a
 * +CREATE TABLE "UserJobAds" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" varchar(27) NOT NULL,
 * +    "jobName" text NOT NULL,
 * +    "adState" text NOT NULL,
 * +    "lastUpdated" timestamptz NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "UserMostValuablePosts", hash: 314072c60ce5974fbc8467eaae30699f
 * @@ -1192,3 +1202,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 5cb5ae009dbd81546cd260d4d7228f7d
 * +-- Schema for "Users", hash: 83f6cae9e5a8e9e8c865f30e5d6030f0
 *  CREATE TABLE "Users" (
 * @@ -1393,2 +1403,3 @@ CREATE TABLE "Users" (
 *      "subforumPreferredLayout" text,
 * +    "hideJobAdUntil" timestamptz,
 *      "experiencedIn" text[],
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "1aeedd5dfed78362382d387f2f2bce84";

import UserJobAds from "../../lib/collections/userJobAds/collection"
import Users from "../../lib/collections/users/collection"
import { addField, createTable, dropField, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, UserJobAds)
  await addField(db, Users, "hideJobAdUntil")
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, UserJobAds)
  await dropField(db, Users, "hideJobAdUntil")
}
