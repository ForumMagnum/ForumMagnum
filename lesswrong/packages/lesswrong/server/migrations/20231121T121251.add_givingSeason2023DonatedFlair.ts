/**
 * Generated on 2023-11-17T16:14:51.568Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index f222af1bc3..c848d42e00 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4a83029d46e8b6afd17ced17bfeb6cf7
 * -
 * --- Accepted on 2023-11-16T19:57:24.000Z by 20231116T195724.addDialogueMatchTable.ts
 * +-- Overall schema hash: b03df6b8a9b5f9dc9457d46d16c3436c
 *  
 * @@ -1118,3 +1116,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 6adb72708a04d37a78e9a9ed4f564915
 * +-- Schema for "Users", hash: 0b60b935a5ff78a1672111ce7b5c0f5e
 *  CREATE TABLE "Users" (
 * @@ -1322,2 +1320,3 @@ CREATE TABLE "Users" (
 *      "afSubmittedApplication" bool,
 * +    "givingSeason2023DonatedFlair" bool DEFAULT false,
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
export const acceptsSchemaHash = "6d8270f44805a1ee0b363924964776e7";

import Users from "../../lib/collections/users/collection";
import { BoolType } from "@/server/sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeason2023DonatedFlair", new BoolType());
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeason2023DonatedFlair");
}
