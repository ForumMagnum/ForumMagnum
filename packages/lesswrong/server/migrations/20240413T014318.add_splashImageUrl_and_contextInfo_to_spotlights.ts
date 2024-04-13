/**
 * Generated on 2024-04-13T01:43:18.535Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 7c9d93ea3c..1f247f03da 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: b2d46df0cf4693fc419953f2fbe9a0cc
 * -
 * --- Accepted on 2024-04-10T22:52:50.000Z by 20240410T225250.add_lastUpdated_to_Sequences.ts
 * +-- Overall schema hash: 03c2c32b40e6a6a6575fc5d9b7cd299b
 *  
 * @@ -1115,3 +1113,3 @@ CREATE TABLE "SplashArtCoordinates" (
 *  
 * --- Schema for "Spotlights", hash: d0d14dcfc4189419701e8fb74cd204d9
 * +-- Schema for "Spotlights", hash: d3fb101a778a1ac403f7e3594811ce4e
 *  CREATE TABLE "Spotlights" (
 * @@ -1129,2 +1127,3 @@ CREATE TABLE "Spotlights" (
 *      "draft" bool NOT NULL DEFAULT true,
 * +    "contextInfo" text,
 *      "showAuthor" bool NOT NULL DEFAULT false,
 * @@ -1133,2 +1132,3 @@ CREATE TABLE "Spotlights" (
 *      "spotlightDarkImageId" text,
 * +    "spotlightSplashImageUrl" text,
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
export const acceptsSchemaHash = "03c2c32b40e6a6a6575fc5d9b7cd299b";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  // TODO
  await addField(db, Spotlights, "spotlightSplashImageUrl")
  await addField(db, Spotlights, "contextInfo")
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
  await dropField(db, Spotlights, "spotlightSplashImageUrl");
  await dropField(db, Spotlights, "contextInfo")

}
