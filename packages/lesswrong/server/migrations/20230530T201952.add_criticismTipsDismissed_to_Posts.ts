/**
 * Generated on 2023-05-30T20:19:52.510Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index cec07694d1..1fe2285ac2 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8ecc349268b355e0efe1de9fba8c38f9
 * -
 * --- Accepted on 2023-05-24T18:34:35.000Z by 20230524T183435.add_hidePostsRecommendations_field.ts
 * +-- Overall schema hash: 8ed79a3bdee90bd2905d51bd75f4d4fd
 *  
 * @@ -481,3 +479,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 1c137ff08da3554ca53a4d51251c143e
 * +-- Schema for "Posts", hash: 8fa0258cc54bd68af99fcb672494a94a
 *  CREATE TABLE "Posts" (
 * @@ -612,2 +610,3 @@ CREATE TABLE "Posts" (
 *      "commentCount" double precision DEFAULT 0,
 * +    "criticismTipsDismissed" bool,
 *      "debate" bool DEFAULT false,
 * @@ -839,3 +838,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: 66c84c8a02ec236dcf00125ab99cc0ce
 * +-- Schema for "Tags", hash: 7e0f5da8c367105df4271994417173a4
 *  CREATE TABLE "Tags" (
 * @@ -880,4 +879,4 @@ CREATE TABLE "Tags" (
 *      "subTagIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
 * -    "autoTagModel" text DEFAULT '',
 * -    "autoTagPrompt" text DEFAULT '',
 * +    "autoTagModel" text,
 * +    "autoTagPrompt" text,
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
export const acceptsSchemaHash = "8ed79a3bdee90bd2905d51bd75f4d4fd";

import Posts from "../../lib/collections/posts/collection"
import Tags from "../../lib/collections/tags/collection";
import { addField, dropField, updateDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await addField(db, Posts, 'criticismTipsDismissed')
  }
  
  if (Tags.isPostgres()) {
    await updateDefaultValue(db, Tags, "autoTagModel")
    await updateDefaultValue(db, Tags, "autoTagPrompt")
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await dropField(db, Posts, 'criticismTipsDismissed')
  }
  
  if (Tags.isPostgres()) {
    await updateDefaultValue(db, Tags, "autoTagModel")
    await updateDefaultValue(db, Tags, "autoTagPrompt")
  }
}
