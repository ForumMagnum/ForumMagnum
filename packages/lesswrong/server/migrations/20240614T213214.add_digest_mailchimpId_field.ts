/**
 * Generated on 2024-06-14T21:32:14.278Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 32226208fe..405b0c276e 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c1dd7ed968b6af5a78625296b5e5fec0
 * -
 * --- Accepted on 2024-06-12T17:35:25.000Z by 20240612T173525.add_onsite_digest_background_fields.ts
 * +-- Overall schema hash: 6a44d0e218e83796522edeaf33effcd9
 *  
 * @@ -721,3 +719,3 @@ CREATE INDEX IF NOT EXISTS "idx_DigestPosts_digestId" ON "DigestPosts" USING btr
 *  
 * --- Table "Digests", hash 4e3d60727228b6e90ea266b8e7378f9d
 * +-- Table "Digests", hash 5e6a39096e5252ceb40198eb8178e1dd
 *  CREATE TABLE "Digests" (
 * @@ -730,2 +728,3 @@ CREATE TABLE "Digests" (
 *    "onsitePrimaryColor" TEXT,
 * +  "mailchimpId" TEXT,
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
export const acceptsSchemaHash = "6a44d0e218e83796522edeaf33effcd9";

import Digests from "@/lib/collections/digests/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Digests, "mailchimpId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Digests, "mailchimpId");
}
