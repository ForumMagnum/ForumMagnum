/**
 * Generated on 2024-09-13T19:31:35.749Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index b7eefce3b9..ee037d3073 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8c84a413224b6139788e7a51da3bc113
 * -
 * --- Accepted on 2024-09-10T14:47:57.000Z by 20240910T144757.revisions_word_count_not_null.ts
 * +-- Overall schema hash: daef9f83fd77670b6fe1ee98ffff75f1
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
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "daef9f83fd77670b6fe1ee98ffff75f1";

import ManifoldProbabilitiesCaches from "@/server/collections/manifoldProbabilitiesCaches/collection";
import { addField, dropField } from "./meta/utils";
import { asyncMapSequential } from "@/lib/utils/asyncUtils";
import { postGetMarketInfoFromManifold } from "@/lib/collections/posts/annualReviewMarkets";
import { createAdminContext } from "../vulcan-lib/query";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";

export const up = async ({db}: MigrationContext) => {
  // Get all of the posts with markets in our database
  const postsWithMarkets = await db.any<DbPost>(`
    SELECT p.*
    FROM "Posts" p
    JOIN "ManifoldProbabilitiesCaches" m
    ON p."manifoldReviewMarketId" = m."marketId"
  `);

  const updatedMarketInfo = await asyncMapSequential(postsWithMarkets, async (post) => {
    const marketInfo = await postGetMarketInfoFromManifold(post);
    return { marketId: post.manifoldReviewMarketId, marketInfo };
  });

  const context = createAdminContext();

  const filteredUpdateMarketInfo = filterNonnull(updatedMarketInfo.map(({ marketId, marketInfo }) => 
    marketInfo && marketId ? { marketId, marketInfo } : null
  ));

  if (filteredUpdateMarketInfo.length === updatedMarketInfo.length) {
    // eslint-disable-next-line no-console
    console.log("All markets have a url, proceeding with the update");
  } else {
    // eslint-disable-next-line no-console
    console.log("Some markets do not have a url, aborting");
    throw new Error("Some markets do not have a url, aborting");
  }

  await addField(db, ManifoldProbabilitiesCaches, "url");

  for (const { marketId, marketInfo } of filteredUpdateMarketInfo) {
    await context.repos.manifoldProbabilitiesCachesRepo.upsertMarketInfoInCache(marketId, marketInfo);
  }
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
  await dropField(db, ManifoldProbabilitiesCaches, "url");

}

