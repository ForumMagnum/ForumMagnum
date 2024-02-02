/**
 * Generated on 2024-02-02T20:17:34.343Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 87b4e828a7..add80fe3c3 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8d50c9ecf4f776b6592956ac590ed246
 * -
 * --- Accepted on 2024-02-01T23:22:48.000Z by 20240201T232248.add_splashArtImageUrl.ts
 * +-- Overall schema hash: 7a02a320ce76de404e1d8cd5a8ad821e
 *  
 * @@ -938,2 +936,17 @@ CREATE TABLE "ReviewVotes" (
 *  
 * +-- Schema for "ReviewWinnerArt", hash: b0a9369bb7a1c224b83d4edb65607dc3
 * +CREATE TABLE "ReviewWinnerArt" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "postId" text NOT NULL,
 * +    "reviewYear" double precision NOT NULL,
 * +    "curatedOrder" double precision NOT NULL,
 * +    "reviewRanking" double precision NOT NULL,
 * +    "postIsAI" bool NOT NULL,
 * +    "splashArtImagePrompt" text,
 * +    "splashArtImageUrl" text,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "ReviewWinners", hash: b8bb1dcb23612898b93928a1a70f5c8a
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "7a02a320ce76de404e1d8cd5a8ad821e";

import ReviewWinners from "../../lib/collections/reviewWinners/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ReviewWinners);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ReviewWinners);
}
