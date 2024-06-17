/**
 * Generated on 2024-02-19T16:17:36.802Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 76ef015cd0..d2606aa611 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 92b57599e36ee19757a1e763216509c5
 * -
 * --- Accepted on 2024-02-13T22:27:00.000Z by 20240213T222700.add_notificationSubscribedUserComment_to_Users.ts
 * +-- Overall schema hash: 3d91e3a1107d44cf3c7bcaf6ee992c82
 *  
 * @@ -434,2 +432,15 @@ CREATE TABLE "GardenCodes" (
 *  
 * +-- Schema for "GoogleServiceAccountSessions", hash: b47eaaf54c33aad397389d07418d24be
 * +CREATE TABLE "GoogleServiceAccountSessions" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "email" text NOT NULL,
 * +    "refreshToken" text NOT NULL,
 * +    "estimatedExpiry" timestamptz NOT NULL,
 * +    "active" bool NOT NULL,
 * +    "revoked" bool NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Images", hash: bbf198b9bbb4d2fb0c64374400bd287b
 * @@ -938,3 +949,3 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "Revisions", hash: 74919ae8bdbb0a368ec1a36d5b0a86ff
 * +-- Schema for "Revisions", hash: 4df2b8cb0da0ae648eea256d967099c8
 *  CREATE TABLE "Revisions" (
 * @@ -955,2 +966,3 @@ CREATE TABLE "Revisions" (
 *      "changeMetrics" jsonb NOT NULL,
 * +    "googleDocMetadata" jsonb,
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
export const acceptsSchemaHash = "10225605411f6e346ca4185fd18de582";

import GoogleServiceAccountSessions from "../../lib/collections/googleServiceAccountSessions/collection"
import Revisions from "../../lib/collections/revisions/collection"
import { addField, createTable, dropField, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, GoogleServiceAccountSessions)
  await addField(db, Revisions, "googleDocMetadata")
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, GoogleServiceAccountSessions)
  await dropField(db, Revisions, "googleDocMetadata")
}
