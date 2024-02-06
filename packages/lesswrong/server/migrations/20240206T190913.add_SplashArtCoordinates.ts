/**
 * Generated on 2024-02-06T19:09:13.173Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index 20e560b305..d5efe2233b 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 429a40ce07bbbf7a69080fd4269efae1
 * -
 * --- Accepted on 2024-02-03T02:15:54.000Z by 20240203T021554.reviewWinnerArts_dropDenormalisedFields.ts
 * +-- Overall schema hash: a646e49b34cd9c6338bc469c3c2430ce
 *  
 * @@ -938,3 +936,3 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "ReviewWinnerArts", hash: 4510487fdadf6d86e64738888298c89a
 * +-- Schema for "ReviewWinnerArts", hash: cf5627337e282ca622a5f1870187c3a1
 *  CREATE TABLE "ReviewWinnerArts" (
 * @@ -942,4 +940,4 @@ CREATE TABLE "ReviewWinnerArts" (
 *      "postId" text NOT NULL,
 * -    "splashArtImagePrompt" text,
 * -    "splashArtImageUrl" text,
 * +    "splashArtImagePrompt" text NOT NULL,
 * +    "splashArtImageUrl" text NOT NULL,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * @@ -1024,2 +1022,18 @@ CREATE TABLE "Sessions" (
 *  
 * +-- Schema for "SplashArtCoordinates", hash: abf85bb5d7068255ef708f432ba178f1
 * +CREATE TABLE "SplashArtCoordinates" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "postId" text NOT NULL,
 * +    "imageId" text NOT NULL,
 * +    "splashArtImageUrl" text,
 * +    "logTime" timestamptz NOT NULL,
 * +    "xCoordinate" double precision NOT NULL,
 * +    "yCoordinate" double precision NOT NULL,
 * +    "width" double precision NOT NULL,
 * +    "height" double precision NOT NULL,
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
export const acceptsSchemaHash = "a646e49b34cd9c6338bc469c3c2430ce";

import { createTable, dropTable } from "./meta/utils"
import SplashArtCoordinates from "../../lib/collections/splashArtCoordinates/collection"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, SplashArtCoordinates);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, SplashArtCoordinates);
}
