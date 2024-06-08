import Digests from "@/lib/collections/digests/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Generated on 2024-06-07T17:14:08.188Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 50e73768bc..81cd4cbe01 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6fc595baf02ccdf4ffdf8777a5981d32
 * -
 * --- Accepted on 2024-05-26T11:13:08.000Z by 20240526T111308.set_not_null_clientId_2.ts
 * +-- Overall schema hash: 64b82494fc0e3e848481a065ddc51437
 *  
 * @@ -721,3 +719,3 @@ CREATE INDEX IF NOT EXISTS "idx_DigestPosts_digestId" ON "DigestPosts" USING btr
 *  
 * --- Table "Digests", hash 0a3508a05198bbe2c61d55924a7d2f2e
 * +-- Table "Digests", hash 4e3d60727228b6e90ea266b8e7378f9d
 *  CREATE TABLE "Digests" (
 * @@ -728,2 +726,4 @@ CREATE TABLE "Digests" (
 *    "publishedDate" TIMESTAMPTZ,
 * +  "onsiteImageId" TEXT,
 * +  "onsitePrimaryColor" TEXT,
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
export const acceptsSchemaHash = "64b82494fc0e3e848481a065ddc51437";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Digests, "onsiteImageId");
  await addField(db, Digests, "onsitePrimaryColor");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Digests, "onsiteImageId");
  await dropField(db, Digests, "onsitePrimaryColor");
}
