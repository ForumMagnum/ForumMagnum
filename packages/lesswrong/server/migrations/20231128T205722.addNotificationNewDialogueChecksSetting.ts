/**
 * Generated on 2023-11-28T20:57:22.137Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index ae273e25f1..c17c32396f 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2e28d7576d143428c88b6c5a8ece4690
 * -
 * --- Accepted on 2023-11-24T20:09:25.000Z by 20231124T200925.move_on_connect_queries_into_migration.ts
 * +-- Overall schema hash: 0a525798e7ce14edc7f59274e00e273b
 *  
 * @@ -1118,3 +1116,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 35f8ce70829fe6ccf6d005353b2d9439
 * +-- Schema for "Users", hash: fc476347f8389e9d90ee4f78e8a13061
 *  CREATE TABLE "Users" (
 * @@ -1213,2 +1211,3 @@ CREATE TABLE "Users" (
 *      "notificationDialogueMatch" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationNewDialogueChecks" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"daily","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "hideDialogueFacilitation" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "0a525798e7ce14edc7f59274e00e273b";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "notificationNewDialogueChecks");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "notificationNewDialogueChecks");
  }
}
