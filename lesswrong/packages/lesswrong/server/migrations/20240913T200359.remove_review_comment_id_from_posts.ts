/**
 * Generated on 2024-09-13T20:03:59.793Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * index b7eefce3b9..edf333dea0 100644
 * --- a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8c84a413224b6139788e7a51da3bc113
 * -
 * --- Accepted on 2024-09-10T14:47:57.000Z by 20240910T144757.revisions_word_count_not_null.ts
 * +-- Overall schema hash: 1184dfb713785c6ceabde629903f40dc
 *  
 * @@ -1113,3 +1111,3 @@ CREATE INDEX IF NOT EXISTS "idx_Localgroups_isOnline_inactive_deleted_name" ON "
 *  
 * --- Table "ManifoldProbabilitiesCaches", hash d13fb558af5fd34e8f5cb019f86f98d1
 * +-- Table "ManifoldProbabilitiesCaches", hash 563fc299b47eb6ce33f5f8d91b621a42
 *  CREATE UNLOGGED TABLE "ManifoldProbabilitiesCaches" (
 * @@ -1121,2 +1119,3 @@ CREATE UNLOGGED TABLE "ManifoldProbabilitiesCaches" (
 *    "lastUpdated" TIMESTAMPTZ NOT NULL,
 * +  "url" TEXT NOT NULL,
 *    "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * @@ -1438,3 +1437,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash 9ce5ea36783cded4c1e97f48831bf2de
 * +-- Table "Posts", hash 6d9ddc0b7c9a84ff67ba340b60681bb1
 *  CREATE TABLE "Posts" (
 * @@ -1476,3 +1475,2 @@ CREATE TABLE "Posts" (
 *    "manifoldReviewMarketId" TEXT,
 * -  "annualReviewMarketCommentId" VARCHAR(27),
 *    "reviewVoteScoreAF" DOUBLE PRECISION NOT NULL DEFAULT 0,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "1184dfb713785c6ceabde629903f40dc";

import { Posts } from "@/lib/collections/posts/collection.ts"
import { addRemovedField, dropRemovedField } from "./meta/utils"
import { StringType } from "../../server/sql/Type";

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Posts, "annualReviewMarketCommentId")
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Posts, "annualReviewMarketCommentId", new StringType())
}
