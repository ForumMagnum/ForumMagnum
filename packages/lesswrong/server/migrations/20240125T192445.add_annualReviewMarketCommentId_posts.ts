/**
 * Generated on 2024-01-25T19:24:45.513Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 31d0fb205c..044e407d59 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6ca26a8acc2d3e6d12a2dc0da191d9f9
 * -
 * --- Accepted on 2024-01-22T21:25:31.000Z by 20240122T212531.add_manifoldReviewMarketId_posts.ts
 * +-- Overall schema hash: e6818754f387c455a5b3db87f495859e
 *  
 * @@ -686,3 +684,3 @@ CREATE TABLE "PostViews" (
 *  
 * --- Schema for "Posts", hash: 749a942fba577055422a802a6450dd99
 * +-- Schema for "Posts", hash: 5ea2dc09a9351c67a7a3e2355affbf3e
 *  CREATE TABLE "Posts" (
 * @@ -724,2 +722,3 @@ CREATE TABLE "Posts" (
 *      "manifoldReviewMarketId" text,
 * +    "annualReviewMarketCommentId" varchar(27),
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
export const acceptsSchemaHash = "e6818754f387c455a5b3db87f495859e";

import { Posts } from "../../lib/collections/posts";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "annualReviewMarketCommentId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "annualReviewMarketCommentId");
}
