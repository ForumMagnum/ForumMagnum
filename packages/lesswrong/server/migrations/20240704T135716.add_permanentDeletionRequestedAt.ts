/**
 * Generated on 2024-07-04T13:57:16.712Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 57971e281c..755a3c31ef 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: b1f9f6080e26c6425541b770717f7c98
 * -
 * --- Accepted on 2024-06-17T09:01:20.000Z by 20240617T090120.add_vibes_check_tables.ts
 * +-- Overall schema hash: 8481cc2bb236b71a51bd5fb687c65ae3
 *  
 * @@ -2978,3 +2976,3 @@ CREATE UNIQUE INDEX IF NOT EXISTS "idx_UserTagRels_tagId_userId" ON "UserTagRels
 *  
 * --- Table "Users", hash 739b71744483048e21e894c27ca6b11e
 * +-- Table "Users", hash fc2302228267a47ab8a5bb65859fd0d4
 *  CREATE TABLE "Users" (
 * @@ -3044,2 +3042,3 @@ CREATE TABLE "Users" (
 *    "deleted" BOOL NOT NULL DEFAULT FALSE,
 * +  "permanentDeletionRequestedAt" TIMESTAMPTZ,
 *    "voteBanned" BOOL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "a2faca5a61a921ed5828a0be4fb26461";

import Users from "@/server/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "permanentDeletionRequestedAt")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "permanentDeletionRequestedAt")
}
