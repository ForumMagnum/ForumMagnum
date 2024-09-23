/**
 * Generated on 2024-09-18T04:57:29.077Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 4d8d535a71..63e7d7a2ca 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1184dfb713785c6ceabde629903f40dc
 * -
 * --- Accepted on 2024-09-13T20:03:59.000Z by 20240913T200359.remove_review_comment_id_from_posts.ts
 * +-- Overall schema hash: e766c875e6c9911dcdd77f9a20a3c9c8
 *  
 * @@ -1439,3 +1437,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash 6d9ddc0b7c9a84ff67ba340b60681bb1
 * +-- Table "Posts", hash bc30e371fd10093bf360c6e5d96d240a
 *  CREATE TABLE "Posts" (
 * @@ -1578,3 +1576,2 @@ CREATE TABLE "Posts" (
 *    "topLevelCommentCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
 * -  "criticismTipsDismissed" BOOL,
 *    "debate" BOOL NOT NULL DEFAULT FALSE,
 * @@ -3055,3 +3052,3 @@ CREATE UNIQUE INDEX IF NOT EXISTS "idx_UserTagRels_tagId_userId" ON "UserTagRels
 *  
 * --- Table "Users", hash 5a1821c6b50f8beeeb4a00f69b53a822
 * +-- Table "Users", hash d7d32b1b66a18682d53bb9fb45bb174d
 *  CREATE TABLE "Users" (
 * @@ -3263,2 +3260,3 @@ CREATE TABLE "Users" (
 *    "hideJobAdUntil" TIMESTAMPTZ,
 * +  "criticismTipsDismissed" BOOL NOT NULL DEFAULT FALSE,
 *    "hideFromPeopleDirectory" BOOL NOT NULL DEFAULT FALSE,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "e766c875e6c9911dcdd77f9a20a3c9c8";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'criticismTipsDismissed')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'criticismTipsDismissed')
}
