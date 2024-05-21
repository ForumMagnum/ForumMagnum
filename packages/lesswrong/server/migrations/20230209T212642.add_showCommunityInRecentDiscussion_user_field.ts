/**
 * Generated on 2023-01-31T23:26:42.561Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index d4791cdac0..fdcb0477ff 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2ad14f1cd0db6f2fdf93dfa328568fe5
 * -
 * --- Accepted on 2023-01-30T15:00:41.000Z by 20230130T150041.create_cronHistory_collection.ts
 * +-- Overall schema hash: c4ad9670df04a3753f9e2db9bb5bade8
 *  
 * @@ -874,3 +872,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: c75f16a2463de260e70fd3818c296e50
 * +-- Schema for "Users", hash: 4419e2e0d0d92ec2f6a4d8b2a653ddcb
 *  CREATE TABLE "Users" (
 * @@ -905,2 +903,3 @@ CREATE TABLE "Users" (
 *      "noCollapseCommentsFrontpage" bool DEFAULT false,
 * +    "showCommunityInRecentDiscussion" bool DEFAULT false,
 *      "petrovOptOut" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "dbc3a1a821f459ad60e85420d4c287c0";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "showCommunityInRecentDiscussion")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "showCommunityInRecentDiscussion")
}
