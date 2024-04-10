/**
 * Generated on 2024-02-01T21:06:58.588Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 7b8cf3620c..e9e4a307c9 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 44cc1cc66be79573b597f5f1168df8ec
 * -
 * --- Accepted on 2024-01-31T23:05:52.000Z by 20240131T230552.add_ManifoldProbabilitiesCaches_table_and_annual_review_fields_to_Posts.ts
 * +-- Overall schema hash: f3add36e62e14d409e005ef7ed969bb2
 *  
 * @@ -938,2 +936,15 @@ CREATE TABLE "ReviewVotes" (
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
export const acceptsSchemaHash = "f3add36e62e14d409e005ef7ed969bb2";

import ReviewWinners from "../../lib/collections/reviewWinners/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ReviewWinners);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ReviewWinners);
}
