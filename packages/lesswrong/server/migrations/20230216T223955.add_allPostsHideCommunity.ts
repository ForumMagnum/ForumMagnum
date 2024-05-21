/**
 * Generated on 2023-02-16T22:39:55.892Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index ac59c4ae41..53b0795e89 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: dbc3a1a821f459ad60e85420d4c287c0
 * -
 * --- Accepted on 2023-02-09T21:26:42.000Z by 20230209T212642.add_showCommunityInRecentDiscussion_user_field.ts
 * +-- Overall schema hash: 0a82b29a9f761a79f5587f6469f51465
 *  
 * @@ -888,3 +886,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 4419e2e0d0d92ec2f6a4d8b2a653ddcb
 * +-- Schema for "Users", hash: 81c37a8199dc46ac8d6053b9455dada5
 *  CREATE TABLE "Users" (
 * @@ -931,2 +929,3 @@ CREATE TABLE "Users" (
 *      "allPostsIncludeEvents" bool,
 * +    "allPostsHideCommunity" bool,
 *      "allPostsOpenSettings" bool,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "0a82b29a9f761a79f5587f6469f51465";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "allPostsHideCommunity")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "allPostsHideCommunity")
}
