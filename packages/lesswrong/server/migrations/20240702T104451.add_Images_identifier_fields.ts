/**
 * Generated on 2024-06-21T12:44:51.216Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 32226208fe..52cf47f419 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c1dd7ed968b6af5a78625296b5e5fec0
 * -
 * --- Accepted on 2024-06-12T17:35:25.000Z by 20240612T173525.add_onsite_digest_background_fields.ts
 * +-- Overall schema hash: 974835efab0ed1491f558eaa70d57749
 *  
 * @@ -935,3 +933,3 @@ CREATE INDEX IF NOT EXISTS "idx_GoogleServiceAccountSessions_schemaVersion" ON "
 *  
 * --- Table "Images", hash 189b95d312f90bdc58525d49b481d7ef
 * +-- Table "Images", hash 11d6e885501b623256a36b7cde0837d2
 *  CREATE TABLE "Images" (
 * @@ -939,2 +937,4 @@ CREATE TABLE "Images" (
 *    "originalUrl" TEXT NOT NULL,
 * +  "identifier" TEXT NOT NULL,
 * +  "identifierType" TEXT,
 *    "cdnHostedUrl" TEXT NOT NULL,
 * @@ -951,2 +951,5 @@ CREATE INDEX IF NOT EXISTS "idx_Images_originalUrl" ON "Images" USING btree ("or
 *  
 * +-- Index "idx_Images_identifier", hash f5094f743a61a4cbbcfca541623a2842
 * +CREATE INDEX IF NOT EXISTS "idx_Images_identifier" ON "Images" USING btree ("identifier");
 * +
 *  -- Index "idx_Images_cdnHostedUrl", hash 0ee56f026b18f07817fccfb5f1395698
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "94df20dba53ef11f79930cbb2c17442c";

import Images from "@/lib/collections/images/collection";
import { addField, dropField, updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "Images" ADD COLUMN IF NOT EXISTS "identifier" TEXT`);
  await db.none(`ALTER TABLE "Images" ADD COLUMN IF NOT EXISTS "identifierType" TEXT`);

  await db.none(`
    UPDATE "Images"
    SET "identifier" = "originalUrl",
        "identifierType" = 'originalUrl'
  `);

  await db.none(`ALTER TABLE "Images" ALTER COLUMN "identifier" SET NOT NULL`);
  await db.none(`ALTER TABLE "Images" ALTER COLUMN "identifierType" SET NOT NULL`);

  await db.none(`ALTER TABLE "Images" ALTER COLUMN "originalUrl" DROP NOT NULL`);
  await updateIndexes(Images)
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Images, "identifier");
  await dropField(db, Images, "identifierType");
  await db.none(`ALTER TABLE "Images" ALTER COLUMN "originalUrl" SET NOT NULL`);
}
