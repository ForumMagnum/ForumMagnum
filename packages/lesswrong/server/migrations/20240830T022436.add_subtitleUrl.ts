/**
 * Generated on 2024-08-30T02:24:36.635Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index fc554e914e..4b0db7e096 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 793addca611706caf3f63f08a909d4ab
 * -
 * --- Accepted on 2024-08-29T03:04:37.000Z by 20240829T030437.add_deletedDraft_and_splash_url_to_spotlights.ts
 * +-- Overall schema hash: 17afacac40e75c7380478219e9b4f751
 *  
 * @@ -2566,3 +2564,3 @@ CREATE INDEX IF NOT EXISTS "idx_SplashArtCoordinates_reviewWinnerArtId_createdAt
 *  
 * --- Table "Spotlights", hash c958c57a85695660df822a13bcd405d7
 * +-- Table "Spotlights", hash 6627408d0dc56b7ea354e9a9bcccb0ae
 *  CREATE TABLE "Spotlights" (
 * @@ -2575,2 +2573,3 @@ CREATE TABLE "Spotlights" (
 *    "customSubtitle" TEXT,
 * +  "subtitleUrl" TEXT,
 *    "headerTitle" TEXT,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "17afacac40e75c7380478219e9b4f751";

import Spotlights from "@/server/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "subtitleUrl")
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
  await dropField(db, Spotlights, "subtitleUrl")
}
