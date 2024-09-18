/**
 * Generated on 2024-09-18T02:43:30.159Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 4d8d535a71..60feb12630 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1184dfb713785c6ceabde629903f40dc
 * -
 * --- Accepted on 2024-09-13T20:03:59.000Z by 20240913T200359.remove_review_comment_id_from_posts.ts
 * +-- Overall schema hash: 5dc4243fcece091f936ea867ebb21edd
 *  
 * @@ -3055,3 +3053,3 @@ CREATE UNIQUE INDEX IF NOT EXISTS "idx_UserTagRels_tagId_userId" ON "UserTagRels
 *  
 * --- Table "Users", hash 5a1821c6b50f8beeeb4a00f69b53a822
 * +-- Table "Users", hash d7d32b1b66a18682d53bb9fb45bb174d
 *  CREATE TABLE "Users" (
 * @@ -3263,2 +3261,3 @@ CREATE TABLE "Users" (
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
export const acceptsSchemaHash = "5dc4243fcece091f936ea867ebb21edd";

import Posts from "@/lib/collections/posts/collection";
import Users from "../../lib/collections/users/collection"
import { addField, addRemovedField, dropField, dropRemovedField } from "./meta/utils"
import { BoolType } from "../sql/Type";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'criticismTipsDismissed')
  await dropRemovedField(db, Posts, "criticismTipsDismissed")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'criticismTipsDismissed')
  await addRemovedField(db, Posts, 'criticismTipsDismissed', new BoolType())
}
