/**
 * Generated on 2024-02-01T23:22:48.194Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 75272dbeb1..cce0f55e36 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f3add36e62e14d409e005ef7ed969bb2
 * -
 * --- Accepted on 2024-02-01T21:06:58.000Z by 20240201T210658.add_ReviewWinners.ts
 * +-- Overall schema hash: 8d50c9ecf4f776b6592956ac590ed246
 *  
 * @@ -938,3 +936,3 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "ReviewWinners", hash: 2607729e53f739e0a42bbfe49998314a
 * +-- Schema for "ReviewWinners", hash: b8bb1dcb23612898b93928a1a70f5c8a
 *  CREATE TABLE "ReviewWinners" (
 * @@ -946,2 +944,3 @@ CREATE TABLE "ReviewWinners" (
 *      "isAI" bool NOT NULL,
 * +    "splashArtImageUrl" text,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "8d50c9ecf4f776b6592956ac590ed246";

import { ReviewWinners } from '../../lib/collections/reviewWinners/collection'
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ReviewWinners, "splashArtImageUrl")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ReviewWinners, "splashArtImageUrl")
}
