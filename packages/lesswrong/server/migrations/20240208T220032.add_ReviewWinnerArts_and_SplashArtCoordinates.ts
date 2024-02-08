/**
 * Generated on 2024-02-08T22:00:32.364Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 71d6c180b1..a89bd2bb37 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1aeedd5dfed78362382d387f2f2bce84
 * -
 * --- Accepted on 2024-02-06T04:16:51.000Z by 20240206T041651.add_UserJobAds_collection.ts
 * +-- Overall schema hash: 697d99679120595b0bfbb1e787f11eb9
 *  
 * @@ -938,2 +936,26 @@ CREATE TABLE "ReviewVotes" (
 *  
 * +-- Schema for "ReviewWinnerArts", hash: cf5627337e282ca622a5f1870187c3a1
 * +CREATE TABLE "ReviewWinnerArts" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "postId" text NOT NULL,
 * +    "splashArtImagePrompt" text NOT NULL,
 * +    "splashArtImageUrl" text NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
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
 * @@ -999,2 +1021,23 @@ CREATE TABLE "Sessions" (
 *  
 * +-- Schema for "SplashArtCoordinates", hash: 8cb73e71cc10cd88fac017755b0d283c
 * +CREATE TABLE "SplashArtCoordinates" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "reviewWinnerArtId" varchar(27) NOT NULL,
 * +    "leftXPct" double precision NOT NULL,
 * +    "leftYPct" double precision NOT NULL,
 * +    "leftHeightPct" double precision NOT NULL,
 * +    "leftWidthPct" double precision NOT NULL,
 * +    "middleXPct" double precision NOT NULL,
 * +    "middleYPct" double precision NOT NULL,
 * +    "middleHeightPct" double precision NOT NULL,
 * +    "middleWidthPct" double precision NOT NULL,
 * +    "rightXPct" double precision NOT NULL,
 * +    "rightYPct" double precision NOT NULL,
 * +    "rightHeightPct" double precision NOT NULL,
 * +    "rightWidthPct" double precision NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Spotlights", hash: d0d14dcfc4189419701e8fb74cd204d9
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "697d99679120595b0bfbb1e787f11eb9";

import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection";
import SplashArtCoordinates from "../../lib/collections/splashArtCoordinates/collection";
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ReviewWinnerArts);
  await createTable(db, SplashArtCoordinates);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ReviewWinnerArts);
  await dropTable(db, SplashArtCoordinates);
}
