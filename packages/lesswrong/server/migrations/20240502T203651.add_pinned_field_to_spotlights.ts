/**
 * Generated on 2024-05-02T20:36:51.470Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 57e28e6aed..5b01f6e2b6 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c192cfffc5d07ae27caf1477da048644
 * -
 * --- Accepted on 2024-04-25T07:56:39.000Z by 20240425T075639.add_people_directory.ts
 * +-- Overall schema hash: 05b006f33baa9e0f91871548f118a704
 *  
 * @@ -1118,3 +1116,3 @@ CREATE TABLE "SplashArtCoordinates" (
 *  
 * --- Schema for "Spotlights", hash: 7d1b610711e6861727fe22df979a9c60
 * +-- Schema for "Spotlights", hash: 48c362b5c0b1a04c0d44e0c03631cfe3
 *  CREATE TABLE "Spotlights" (
 * @@ -1139,2 +1137,3 @@ CREATE TABLE "Spotlights" (
 *      "spotlightSplashImageUrl" text,
 * +    "pinned" bool NOT NULL DEFAULT false,
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
// export const acceptsSchemaHash = "05b006f33baa9e0f91871548f118a704";

import { addField, dropField } from "./meta/utils";
import Spotlights from "../../lib/collections/spotlights/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "pinned");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "pinned");
}
