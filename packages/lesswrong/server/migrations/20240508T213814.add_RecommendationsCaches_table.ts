/**
 * Generated on 2024-05-08T21:38:14.650Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 6995c1fa16..8500b04640 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5f15590a8aa900ee210026b863dde23e
 * -
 * --- Accepted on 2024-05-02T16:44:37.000Z by 20240502T164437.include_indexes_and_views_in_schema.ts
 * +-- Overall schema hash: 224c974d441de3727845f2dec5ba8aac
 *  
 * @@ -1515,2 +1513,22 @@ CREATE INDEX IF NOT EXISTS "idx_ReadStatuses_userId_tagId_isRead_lastUpdated" ON
 *  
 * +-- Schema for "RecommendationsCaches", hash: 9aad06802a8fe4af47e99405d85df8ea
 * +CREATE TABLE "RecommendationsCaches" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" text NOT NULL,
 * +    "postId" text NOT NULL,
 * +    "source" text NOT NULL,
 * +    "scenario" text NOT NULL,
 * +    "attributionId" text NOT NULL,
 * +    "ttlMs" double precision NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 * +-- Index "idx_RecommendationsCaches_schemaVersion" ON "RecommendationsCaches", hash: 724af3924bb835f78015c2cdeafb185c
 * +CREATE INDEX IF NOT EXISTS "idx_RecommendationsCaches_schemaVersion" ON "RecommendationsCaches" USING btree ("schemaVersion");
 * +
 * +-- Index "idx_RecommendationsCaches_userId_postId_source_scenario" ON "RecommendationsCaches", hash: 8d5452d78b768d6154f784fffe33344f
 * +CREATE UNIQUE INDEX IF NOT EXISTS "idx_RecommendationsCaches_userId_postId_source_scenario" ON "RecommendationsCaches" USING btree ("userId", "postId", "source", "scenario");
 * +
 *  -- Schema for "Reports", hash: 530b39ba4f9ee042c04e475212d19312
 * @@ -2556,3 +2574,8 @@ WHERE
 *  
 * --- Custom index, hash: e9ff4b3670f1b0baceb91a2db70a7f57
 * +-- Custom index, hash: 603f80dc36b22b97c313af3eb0f9d568
 * +CREATE INDEX IF NOT EXISTS "idx_Users_subscribed_to_curated_verified" ON "Users" USING btree ("emailSubscribedToCurated", "unsubscribeFromAll", "deleted", "email", fm_has_verified_email (emails), "_id")
 * +WHERE
 * +    "emailSubscribedToCurated" IS TRUE AND "unsubscribeFromAll" IS NOT TRUE AND "deleted" IS NOT TRUE AND "email" IS NOT NULL AND fm_has_verified_email (emails);
 * +
 * +-- Custom index, hash: 480ced786a330b105dfacf424868d573
 *  CREATE INDEX IF NOT EXISTS "idx_Users_subscribed_to_curated" ON "Users" USING btree ("emailSubscribedToCurated", "unsubscribeFromAll", "deleted", "email", "_id")
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "224c974d441de3727845f2dec5ba8aac";

import RecommendationsCaches from "../../lib/collections/recommendationsCaches/collection"
import { createTable, dropTable, updateCustomIndexes, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, RecommendationsCaches);
  await updateIndexes(RecommendationsCaches);
  await updateCustomIndexes(db);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, RecommendationsCaches);
}
