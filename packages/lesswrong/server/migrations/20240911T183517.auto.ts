/**
 * Generated on 2024-09-11T18:35:17.987Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * index f93e54104a..cbb69379bc 100644
 * --- a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4478fe67319e5ebbe8327768fc26f5f4
 * -
 * --- Accepted on 2024-09-06T19:20:38.000Z by 20240906T192038.lwevents_ip_index.ts
 * +-- Overall schema hash: c74dfa42344f7e072c70600013adb1f8
 *  
 * @@ -1438,3 +1436,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash 9ce5ea36783cded4c1e97f48831bf2de
 * +-- Table "Posts", hash 6679526700198f79756440f36fa038c6
 *  CREATE TABLE "Posts" (
 * @@ -1476,2 +1474,3 @@ CREATE TABLE "Posts" (
 *    "manifoldReviewMarketId" TEXT,
 * +  "manifoldReviewMarketUrl" TEXT,
 *    "annualReviewMarketCommentId" VARCHAR(27),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "c74dfa42344f7e072c70600013adb1f8";

import { Posts } from "@/lib/collections/posts";
import { addField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // TODO
  await addField(db, Posts, "manifoldReviewMarketUrl");
  
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
