/**
 * Generated on 2024-06-18T02:28:14.756Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 3706564bf7..720e7c6765 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6a44d0e218e83796522edeaf33effcd9
 * -
 * --- Accepted on 2024-06-14T21:32:14.000Z by 20240614T213214.add_digest_mailchimpId_field.ts
 * +-- Overall schema hash: 2517c4978c4c1038f74a5f48e8e8e107
 *  
 * @@ -721,3 +719,3 @@ CREATE INDEX IF NOT EXISTS "idx_DigestPosts_digestId" ON "DigestPosts" USING btr
 *  
 * --- Table "Digests", hash 5e6a39096e5252ceb40198eb8178e1dd
 * +-- Table "Digests", hash 97ae5d2f2c0731f1f5021b059f0a7c80
 *  CREATE TABLE "Digests" (
 * @@ -730,3 +728,3 @@ CREATE TABLE "Digests" (
 *    "onsitePrimaryColor" TEXT,
 * -  "mailchimpId" TEXT,
 * +  "postId" VARCHAR(27),
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
export const acceptsSchemaHash = "2517c4978c4c1038f74a5f48e8e8e107";

import Digests from "@/lib/collections/digests/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Digests, "postId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Digests, "postId");
}

