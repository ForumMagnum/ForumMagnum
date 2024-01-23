/**
 * Generated on 2024-01-23T02:34:42.687Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 717d06c846..8932d83647 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7dbf024fc86645c003e6ca3f42cf3af5
 * -
 * --- Accepted on 2024-01-18T10:47:51.000Z by 20240118T104751.add_PostView_PostViewTimes.ts
 * +-- Overall schema hash: 47f6e437817bb150ea52cfece8c1579d
 *  
 * @@ -923,2 +921,15 @@ CREATE TABLE "ReviewVotes" (
 *  
 * +-- Schema for "ReviewWinners", hash: 2607729e53f739e0a42bbfe49998314a
 * +CREATE TABLE "ReviewWinners" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "postId" text NOT NULL,
 * +    "reviewYear" double precision NOT NULL,
 * +    "curatedOrder" double precision NOT NULL,
 * +    "reviewRanking" double precision NOT NULL,
 * +    "isAI" bool NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Revisions", hash: 74919ae8bdbb0a368ec1a36d5b0a86ff
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "47f6e437817bb150ea52cfece8c1579d";

import ReviewWinners from "../../lib/collections/reviewWinners/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ReviewWinners);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ReviewWinners);
}
