/**
 * Generated on 2024-03-29T22:11:18.303Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 8d642a25c9..4ace69be36 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5fb909476a7c6ef9567f7efb1abd005f
 * -
 * --- Accepted on 2024-03-16T00:25:00.000Z by 20240316T002500.add_CurationEmails_table.ts
 * +-- Overall schema hash: 15e67a7cabc41723b3215bcb7dc9488e
 *  
 * @@ -1313,3 +1311,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: af750446e31d4508024688d2ee42896f
 * +-- Schema for "Users", hash: c986a21b18fc4f4e0b7ac2135776aa61
 *  CREATE TABLE "Users" (
 * @@ -1392,2 +1390,3 @@ CREATE TABLE "Users" (
 *      "notificationSubscribedTagPost" jsonb NOT NULL DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * +    "notificationSubscribedSequencePost" jsonb NOT NULL DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 *      "notificationPrivateMessage" jsonb NOT NULL DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "15e67a7cabc41723b3215bcb7dc9488e";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationSubscribedSequencePost")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationSubscribedSequencePost")
}
