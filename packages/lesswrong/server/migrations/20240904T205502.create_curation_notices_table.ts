/**
 * Generated on 2024-09-04T20:55:02.054Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/accepted_schema.sql b/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * index 7e8068bf8d..7b5f2d534d 100644
 * --- a/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 17afacac40e75c7380478219e9b4f751
 * -
 * --- Accepted on 2024-08-30T02:24:36.000Z by 20240830T022436.add_subtitleUrl.ts
 * +-- Overall schema hash: f857f474b5a374350cc1797a5d9240fa
 *  
 * @@ -623,2 +621,19 @@ CREATE UNIQUE INDEX IF NOT EXISTS "idx_CurationEmails_userId" ON "CurationEmails
 *  
 * +-- Table "CurationNotices", hash caf2ebd174f2f834401a4870093c1ccd
 * +CREATE TABLE "CurationNotices" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "userId" VARCHAR(27) NOT NULL,
 * +  "commentId" VARCHAR(27),
 * +  "postId" VARCHAR(27),
 * +  "deleted" BOOL NOT NULL DEFAULT FALSE,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB,
 * +  "contents" JSONB,
 * +  "contents_latest" TEXT
 * +);
 * +
 * +-- Index "idx_CurationNotices_schemaVersion", hash c9eb30bb11094ae53aeddc39afaa1527
 * +CREATE INDEX IF NOT EXISTS "idx_CurationNotices_schemaVersion" ON "CurationNotices" USING btree ("schemaVersion");
 * +
 *  -- Table "DatabaseMetadata", hash 2835c102780dd1575934e3a270a184b0
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f857f474b5a374350cc1797a5d9240fa";

import { CurationNotices } from "../../server/collections/curationNotices/collection.ts"
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CurationNotices);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, CurationNotices);
}
