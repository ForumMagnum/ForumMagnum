/**
 * Generated on 2024-06-27T17:39:06.502Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index ecf22bb1ad..895481bfeb 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: b1f9f6080e26c6425541b770717f7c98
 * -
 * --- Accepted on 2024-06-17T09:01:20.000Z by 20240617T090120.add_vibes_check_tables.ts
 * +-- Overall schema hash: af39464b13d09507b438054d15aba060
 *  
 * @@ -860,3 +858,3 @@ CREATE INDEX IF NOT EXISTS "idx_FeaturedResources_schemaVersion" ON "FeaturedRes
 *  
 * --- Table "ForumEvents", hash d718418630525df990c654b4cd20e047
 * +-- Table "ForumEvents", hash 61e8a083abfa15e17af9349c6a10c088
 *  CREATE TABLE "ForumEvents" (
 * @@ -868,4 +866,7 @@ CREATE TABLE "ForumEvents" (
 *    "lightColor" TEXT NOT NULL,
 * +  "contrastColor" TEXT,
 *    "tagId" VARCHAR(27) NOT NULL,
 *    "bannerImageId" TEXT,
 * +  "includesPoll" BOOL NOT NULL DEFAULT FALSE,
 * +  "publicData" JSONB,
 *    "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * @@ -875,2 +876,4 @@ CREATE TABLE "ForumEvents" (
 *    "frontpageDescription_latest" TEXT,
 * +  "frontpageDescriptionMobile" JSONB,
 * +  "frontpageDescriptionMobile_latest" TEXT,
 *    "postPageDescription" JSONB,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "af39464b13d09507b438054d15aba060";

import ForumEvents from "@/server/collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "contrastColor");
  await addField(db, ForumEvents, "includesPoll");
  await addField(db, ForumEvents, "publicData");
  await addField(db, ForumEvents, "frontpageDescriptionMobile");
  await addField(db, ForumEvents, "frontpageDescriptionMobile_latest");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "contrastColor");
  await dropField(db, ForumEvents, "includesPoll");
  await dropField(db, ForumEvents, "publicData");
  await dropField(db, ForumEvents, "frontpageDescriptionMobile");
  await dropField(db, ForumEvents, "frontpageDescriptionMobile_latest");
}
