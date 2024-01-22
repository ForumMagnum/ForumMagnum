/**
 * Generated on 2024-01-22T21:25:31.111Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 717d06c846..3668f4748f 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7dbf024fc86645c003e6ca3f42cf3af5
 * -
 * --- Accepted on 2024-01-18T10:47:51.000Z by 20240118T104751.add_PostView_PostViewTimes.ts
 * +-- Overall schema hash: 6ca26a8acc2d3e6d12a2dc0da191d9f9
 *  
 * @@ -686,3 +684,3 @@ CREATE TABLE "PostViews" (
 *  
 * --- Schema for "Posts", hash: 34f525156e944ed443d26e4b60b443e9
 * +-- Schema for "Posts", hash: 749a942fba577055422a802a6450dd99
 *  CREATE TABLE "Posts" (
 * @@ -723,2 +721,3 @@ CREATE TABLE "Posts" (
 *      "positiveReviewVoteCount" double precision NOT NULL DEFAULT 0,
 * +    "manifoldReviewMarketId" text,
 *      "reviewVoteScoreAF" double precision NOT NULL DEFAULT 0,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "6ca26a8acc2d3e6d12a2dc0da191d9f9";

import { Posts } from "../../lib/collections/posts";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "manifoldReviewMarketId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "manifoldReviewMarketId");
}
