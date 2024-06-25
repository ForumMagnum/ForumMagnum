/**
 * Generated on 2024-06-24T22:46:01.029Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 32226208fe..f1ec139738 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c1dd7ed968b6af5a78625296b5e5fec0
 * -
 * --- Accepted on 2024-06-12T17:35:25.000Z by 20240612T173525.add_onsite_digest_background_fields.ts
 * +-- Overall schema hash: 3f8064983aa4d12578752d2fede56766
 *  
 * @@ -860,3 +858,3 @@ CREATE INDEX IF NOT EXISTS "idx_FeaturedResources_schemaVersion" ON "FeaturedRes
 *  
 * --- Table "ForumEvents", hash 793fe4aa01b995448bcd9f27843121f5
 * +-- Table "ForumEvents", hash d718418630525df990c654b4cd20e047
 *  CREATE TABLE "ForumEvents" (
 * @@ -868,4 +866,7 @@ CREATE TABLE "ForumEvents" (
 *    "lightColor" TEXT NOT NULL,
 * +  "contrastColor" TEXT,
 *    "tagId" VARCHAR(27) NOT NULL,
 *    "bannerImageId" TEXT,
 * +  "includesPoll" BOOL,
 * +  "publicData" JSONB,
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
export const acceptsSchemaHash = "3f8064983aa4d12578752d2fede56766";

import ForumEvents from "@/lib/collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ForumEvents, "contrastColor");
  await addField(db, ForumEvents, "includesPoll");
  await addField(db, ForumEvents, "publicData");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ForumEvents, "contrastColor");
  await dropField(db, ForumEvents, "includesPoll");
  await dropField(db, ForumEvents, "publicData");
}
