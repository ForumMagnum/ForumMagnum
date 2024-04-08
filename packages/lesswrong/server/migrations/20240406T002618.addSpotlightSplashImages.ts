/**
 * Generated on 2024-04-06T00:26:18.147Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 4118b6d2f9..5992a0006e 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 86723d78e7eb5d43201e0be72ee6f5f0
 * -
 * --- Accepted on 2024-04-04T01:14:23.000Z by 20240404T011423.add_ArbitalCaches.ts
 * +-- Overall schema hash: b1b00099dd26835e59150c483f5c71a8
 *  
 * @@ -1103,3 +1101,3 @@ CREATE TABLE "SplashArtCoordinates" (
 *  
 * --- Schema for "Spotlights", hash: d0d14dcfc4189419701e8fb74cd204d9
 * +-- Schema for "Spotlights", hash: 85928523e5693110c02ae753c4040357
 *  CREATE TABLE "Spotlights" (
 * @@ -1121,2 +1119,3 @@ CREATE TABLE "Spotlights" (
 *      "spotlightDarkImageId" text,
 * +    "spotlightSplashImageId" text,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -----------`--------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "13c56b877036d828d52d9216b1029d74";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  // TODO
  await addField(db, Spotlights, "spotlightSplashImageUrl")
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
  await dropField(db, Spotlights, "spotlightSplashImageUrl");
}
