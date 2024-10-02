/**
 * Generated on 2024-10-02T23:20:10.872Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * index ddfc718677..e3e74b9d38 100644
 * --- a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4176699fcd50a096b6fd2437aec71b01
 * -
 * --- Accepted on 2024-09-25T02:00:54.000Z by 20240925T020054.create_petrovDayAction.ts
 * +-- Overall schema hash: d11b00f184d38bc2861f3b41fb43acfa
 *  
 * @@ -978,2 +976,21 @@ CREATE INDEX IF NOT EXISTS "idx_Images_cdnHostedUrl" ON "Images" USING btree ("c
 *  
 * +-- Table "JargonTerms", hash ea742eff56c5be2a727b4c469502161c
 * +CREATE TABLE "JargonTerms" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "postId" TEXT NOT NULL,
 * +  "term" TEXT NOT NULL,
 * +  "humansAndOrAIEdited" TEXT NOT NULL,
 * +  "forLaTeX" BOOL NOT NULL DEFAULT FALSE,
 * +  "rejected" BOOL NOT NULL DEFAULT FALSE,
 * +  "altTerms" TEXT[] NOT NULL DEFAULT '{}',
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB,
 * +  "contents" JSONB,
 * +  "contents_latest" TEXT
 * +);
 * +
 * +-- Index "idx_JargonTerms_schemaVersion", hash 3dc15f8e1aa954b5790cf26d2425615c
 * +CREATE INDEX IF NOT EXISTS "idx_JargonTerms_schemaVersion" ON "JargonTerms" USING btree ("schemaVersion");
 * +
 *  -- Table "LWEvents", hash d2758469185cd83bd1feb55c069a1a4f
 * @@ -1456,3 +1473,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash bc30e371fd10093bf360c6e5d96d240a
 * +-- Table "Posts", hash 8b6e100bdcb7d44c4c944ee65a2d992e
 *  CREATE TABLE "Posts" (
 * @@ -1494,2 +1511,3 @@ CREATE TABLE "Posts" (
 *    "manifoldReviewMarketId" TEXT,
 * +  "jargonTerms" JSONB,
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
export const acceptsSchemaHash = "d11b00f184d38bc2861f3b41fb43acfa";

import { JargonTerms } from "../../lib/collections/jargonTerms/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, JargonTerms)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, JargonTerms);
}
