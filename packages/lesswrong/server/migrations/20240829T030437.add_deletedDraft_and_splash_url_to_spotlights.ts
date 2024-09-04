/**
 * Generated on 2024-08-29T03:04:37.997Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 8c783a2fbd..18a130b22c 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: fbfbc086986d64913d7474fde81eaea8
 * -
 * --- Accepted on 2024-08-29T00:27:52.000Z by 20240829T002752.add_deletedDraft_and_spotlightSplashImageUrl_to_spotlight.ts
 * +-- Overall schema hash: 793addca611706caf3f63f08a909d4ab
 *  
 * @@ -2566,3 +2564,3 @@ CREATE INDEX IF NOT EXISTS "idx_SplashArtCoordinates_reviewWinnerArtId_createdAt
 *  
 * --- Table "Spotlights", hash 9009cb0999911d8a279a38c18998ef5a
 * +-- Table "Spotlights", hash c958c57a85695660df822a13bcd405d7
 *  CREATE TABLE "Spotlights" (
 * @@ -2579,2 +2577,3 @@ CREATE TABLE "Spotlights" (
 *    "lastPromotedAt" TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
 * +  "spotlightSplashImageUrl" TEXT,
 *    "draft" BOOL NOT NULL DEFAULT TRUE,
 * @@ -2586,3 +2585,2 @@ CREATE TABLE "Spotlights" (
 *    "spotlightDarkImageId" TEXT,
 * -  "spotlightSplashImageUrl" TEXT,
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
export const acceptsSchemaHash = "793addca611706caf3f63f08a909d4ab";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "deletedDraft")
  await addField(db, Spotlights, "spotlightSplashImageUrl")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "deletedDraft");
  await dropField(db, Spotlights, "spotlightSplashImageUrl");
}

