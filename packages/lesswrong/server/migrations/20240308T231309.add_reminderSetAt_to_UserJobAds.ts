/**
 * Generated on 2024-03-08T23:13:09.945Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index adf3f04425..d8fe4f1b34 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 10225605411f6e346ca4185fd18de582
 * -
 * --- Accepted on 2024-02-29T14:03:17.000Z by 20240229T140317.add_GoogleServiceAccountSessions.ts
 * +-- Overall schema hash: 9ebb51a67d889b5907585d2a7073434d
 *  
 * @@ -1232,3 +1230,3 @@ CREATE TABLE "UserEAGDetails" (
 *  
 * --- Schema for "UserJobAds", hash: cbe262a3b5b91e45d97e57a62c0e7b6a
 * +-- Schema for "UserJobAds", hash: b09353ff904809046fe0ea0a6c7fe8a9
 *  CREATE TABLE "UserJobAds" (
 * @@ -1238,2 +1236,3 @@ CREATE TABLE "UserJobAds" (
 *      "adState" text NOT NULL,
 * +    "reminderSetAt" timestamptz,
 *      "lastUpdated" timestamptz NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "9ebb51a67d889b5907585d2a7073434d";

import UserJobAds from "../../server/collections/userJobAds/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, UserJobAds, "reminderSetAt")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, UserJobAds, "reminderSetAt")
}
