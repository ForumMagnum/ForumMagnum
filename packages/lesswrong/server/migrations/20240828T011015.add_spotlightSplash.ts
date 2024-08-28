/**
 * Generated on 2024-08-28T01:10:15.819Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 255a3886ea..d13db775f3 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: e4f656b97627c2f035fdee90d49cb5dc
 * -
 * --- Accepted on 2024-08-27T18:52:18.000Z by 20240827T185218.create_LlmConversationsAndMessages_tables.ts
 * +-- Overall schema hash: 53940b0988baa29480c0c5358b9c20cb
 *  
 * @@ -2566,3 +2564,3 @@ CREATE INDEX IF NOT EXISTS "idx_SplashArtCoordinates_reviewWinnerArtId_createdAt
 *  
 * --- Table "Spotlights", hash 2a5e479e518ab2873651cd8f97bfe770
 * +-- Table "Spotlights", hash a6522d8dba15bf030259a999acaacc59
 *  CREATE TABLE "Spotlights" (
 * @@ -2585,2 +2583,3 @@ CREATE TABLE "Spotlights" (
 *    "spotlightDarkImageId" TEXT,
 * +  "spotlightSplashImageUrl" TEXT,
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
export const acceptsSchemaHash = "53940b0988baa29480c0c5358b9c20cb";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "spotlightSplashImageUrl")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "spotlightSplashImageUrl");
}
