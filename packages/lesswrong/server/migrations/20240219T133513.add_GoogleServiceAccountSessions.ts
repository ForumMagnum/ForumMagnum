/**
 * Generated on 2024-02-19T13:35:13.418Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 76ef015cd0..76293ae51f 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 92b57599e36ee19757a1e763216509c5
 * -
 * --- Accepted on 2024-02-13T22:27:00.000Z by 20240213T222700.add_notificationSubscribedUserComment_to_Users.ts
 * +-- Overall schema hash: c9bcf04a722bfbfec093bfcf241260d0
 *  
 * @@ -434,2 +432,14 @@ CREATE TABLE "GardenCodes" (
 *  
 * +-- Schema for "GoogleServiceAccountSessions", hash: 2d363f7ec4ea1a095b267d1c89715d6d
 * +CREATE TABLE "GoogleServiceAccountSessions" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "email" text NOT NULL,
 * +    "refreshToken" text NOT NULL,
 * +    "estimatedExpiry" timestamptz NOT NULL,
 * +    "active" bool NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Images", hash: bbf198b9bbb4d2fb0c64374400bd287b
 * @@ -938,3 +948,3 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "Revisions", hash: 74919ae8bdbb0a368ec1a36d5b0a86ff
 * +-- Schema for "Revisions", hash: 4df2b8cb0da0ae648eea256d967099c8
 *  CREATE TABLE "Revisions" (
 * @@ -955,2 +965,3 @@ CREATE TABLE "Revisions" (
 *      "changeMetrics" jsonb NOT NULL,
 * +    "googleDocMetadata" jsonb,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * @@ -1204,3 +1215,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 3a8013cc70ef2d83d1fd3ec8c97315ce
 * +-- Schema for "Users", hash: 66bdfe7b339d02709741951f0a8bbc7a
 *  CREATE TABLE "Users" (
 * @@ -1419,2 +1430,3 @@ CREATE TABLE "Users" (
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
// export const acceptsSchemaHash = "c9bcf04a722bfbfec093bfcf241260d0";

import GoogleServiceAccountSessions from "../../lib/collections/googleServiceAccountSessions/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, GoogleServiceAccountSessions)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, GoogleServiceAccountSessions)
}
