/**
 * Generated on 2023-10-06T07:18:53.972Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/accepted_schema.sql b/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/schema_to_accept.sql
 * index 012a90f52c..5fd6f80725 100644
 * --- a/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/accepted_schema.sql
 * +++ b/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c7d6d21198c4725672bcea289b5c32ff
 * -
 * --- Accepted on 2023-09-15T22:44:33.000Z by 20230915T224433.create_typing_indicator_table.ts
 * +-- Overall schema hash: fc67979155ff8529d2207d6cbbe433a1
 *  
 * @@ -1031,3 +1029,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 269813160b5b2c5562d86035253bf007
 * +-- Schema for "Users", hash: 08568cdad33bd615fe35d8f958900340
 *  CREATE TABLE "Users" (
 * @@ -1227,2 +1225,11 @@ CREATE TABLE "Users" (
 *      "afSubmittedApplication" bool,
 * +    "wu_uuid" uuid,
 * +    "first_name" text,
 * +    "last_name" text,
 * +    "avatar" text,
 * +    "wu_created_at" timestamptz,
 * +    "wu_forum_access" bool,
 * +    "wu_has_ever_been_paid_subscriber" bool,
 * +    "wu_subscription_expires_at" timestamptz,
 * +    "wu_subscription_active" bool,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "fc67979155ff8529d2207d6cbbe433a1";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, 'wu_uuid');
    await addField(db, Users, 'first_name');
    await addField(db, Users, 'last_name');
    await addField(db, Users, 'avatar');
    await addField(db, Users, 'wu_created_at');
    await addField(db, Users, 'wu_forum_access');
    await addField(db, Users, 'wu_has_ever_been_paid_subscriber');
    await addField(db, Users, 'wu_subscription_expires_at');
    await addField(db, Users, 'wu_subscription_active');
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, 'wu_uuid');
    await dropField(db, Users, 'first_name');
    await dropField(db, Users, 'last_name');
    await dropField(db, Users, 'avatar');
    await dropField(db, Users, 'wu_created_at');
    await dropField(db, Users, 'wu_forum_access');
    await dropField(db, Users, 'wu_has_ever_been_paid_subscriber');
    await dropField(db, Users, 'wu_subscription_expires_at');
    await dropField(db, Users, 'wu_subscription_active');
  }  
}
