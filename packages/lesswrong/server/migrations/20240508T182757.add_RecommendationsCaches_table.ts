/**
 * Generated on 2024-05-08T18:27:57.693Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 1be8189afd..8b0b35a66a 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ce481181abda13b83244a8ccd8ed5782
 * -
 * --- Accepted on 2024-04-29T15:57:12.000Z by 20240429T155712.add_fm_get_user_by_login_token_function.ts
 * +-- Overall schema hash: c5afce1efd609ee5b52a294b0eaa32fc
 *  
 * @@ -960,2 +958,16 @@ CREATE TABLE "ReadStatuses" (
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
 *  -- Schema for "Reports", hash: 530b39ba4f9ee042c04e475212d19312
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c5afce1efd609ee5b52a294b0eaa32fc";

import RecommendationsCaches from "../../lib/collections/recommendationsCaches/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, RecommendationsCaches);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, RecommendationsCaches);
}
