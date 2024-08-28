/**
 * Generated on 2024-08-28T19:50:22.492Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index f34e0b09e7..ed0f90ea20 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 53940b0988baa29480c0c5358b9c20cb
 * -
 * --- Accepted on 2024-08-28T01:10:15.000Z by 20240828T011015.add_spotlightSplash.ts
 * +-- Overall schema hash: e4fd967aec2e944bd86c0863942c876d
 *  
 * @@ -2566,3 +2564,3 @@ CREATE INDEX IF NOT EXISTS "idx_SplashArtCoordinates_reviewWinnerArtId_createdAt
 *  
 * --- Table "Spotlights", hash a6522d8dba15bf030259a999acaacc59
 * +-- Table "Spotlights", hash 9009cb0999911d8a279a38c18998ef5a
 *  CREATE TABLE "Spotlights" (
 * @@ -2580,2 +2578,3 @@ CREATE TABLE "Spotlights" (
 *    "draft" BOOL NOT NULL DEFAULT TRUE,
 * +  "deletedDraft" BOOL NOT NULL DEFAULT FALSE,
 *    "showAuthor" BOOL NOT NULL DEFAULT FALSE,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "e4fd967aec2e944bd86c0863942c876d";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "deletedDraft")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "deletedDraft");
}
