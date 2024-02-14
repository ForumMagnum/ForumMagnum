/**
 * Generated on 2024-02-14T17:14:36.004Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 76ef015cd0..962adc99a6 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 92b57599e36ee19757a1e763216509c5
 * -
 * --- Accepted on 2024-02-13T22:27:00.000Z by 20240213T222700.add_notificationSubscribedUserComment_to_Users.ts
 * +-- Overall schema hash: 8fe3fdd742ef740a2004a97c1146a987
 *  
 * @@ -1204,3 +1202,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 3a8013cc70ef2d83d1fd3ec8c97315ce
 * +-- Schema for "Users", hash: 64ebe5ae3648c74dd24e703c50f2f12e
 *  CREATE TABLE "Users" (
 * @@ -1358,2 +1356,3 @@ CREATE TABLE "Users" (
 *      "usersContactedBeforeReview" text[],
 * +    "attemptedToContactBeforeReview" text[],
 *      "fullName" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "8fe3fdd742ef740a2004a97c1146a987";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "attemptedToContactBeforeReview")
  await db.none('UPDATE "Users" SET "attemptedToContactBeforeReview" = "usersContactedBeforeReview"');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "attemptedToContactBeforeReview")
}
