/**
 * Generated on 2024-10-04T23:12:11.671Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * index 19f4c789bc..fe92151758 100644
 * --- a/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/benpace/Documents/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d11b00f184d38bc2861f3b41fb43acfa
 * -
 * --- Accepted on 2024-10-02T23:20:10.000Z by 20241002T232010.add_jargon_terms_table.ts
 * +-- Overall schema hash: d9b155bfb158cc8e10c958d4da548d5b
 *  
 * @@ -978,3 +976,3 @@ CREATE INDEX IF NOT EXISTS "idx_Images_cdnHostedUrl" ON "Images" USING btree ("c
 *  
 * --- Table "JargonTerms", hash ea742eff56c5be2a727b4c469502161c
 * +-- Table "JargonTerms", hash ff0b57e756e83853a2a0d419262e9929
 *  CREATE TABLE "JargonTerms" (
 * @@ -983,5 +981,6 @@ CREATE TABLE "JargonTerms" (
 *    "term" TEXT NOT NULL,
 * -  "humansAndOrAIEdited" TEXT NOT NULL,
 * +  "humansAndOrAIEdited" TEXT NOT NULL DEFAULT 'humans',
 *    "forLaTeX" BOOL NOT NULL DEFAULT FALSE,
 *    "rejected" BOOL NOT NULL DEFAULT FALSE,
 * +  "deleted" BOOL NOT NULL DEFAULT FALSE,
 *    "altTerms" TEXT[] NOT NULL DEFAULT '{}',
 * @@ -1475,3 +1474,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash 8b6e100bdcb7d44c4c944ee65a2d992e
 * +-- Table "Posts", hash bc30e371fd10093bf360c6e5d96d240a
 *  CREATE TABLE "Posts" (
 * @@ -1513,3 +1512,2 @@ CREATE TABLE "Posts" (
 *    "manifoldReviewMarketId" TEXT,
 * -  "jargonTerms" JSONB,
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
export const acceptsSchemaHash = "d9b155bfb158cc8e10c958d4da548d5b";

import JargonTerms from "@/lib/collections/jargonTerms/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, JargonTerms, "deleted")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, JargonTerms, "deleted")
}


