/**
 * Generated on 2024-10-16T01:30:19.299Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index b08904a6eb..5ff64157ff 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2632feebddfb9dab3164c82e2f77bdb8
 * -
 * --- Accepted on 2024-10-08T23:27:15.000Z by 20241008T232715.dropBrokenExtendedVoteTypeIndex.ts
 * +-- Overall schema hash: 9bff3fcce056471127ba9282be7be567
 *  
 * @@ -993,2 +991,20 @@ CREATE INDEX IF NOT EXISTS "idx_Images_cdnHostedUrl" ON "Images" USING btree ("c
 *  
 * +-- Table "JargonTerms", hash af166cd7307432bdd37adb3c448a2cd5
 * +CREATE TABLE "JargonTerms" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "postId" TEXT NOT NULL,
 * +  "term" TEXT NOT NULL,
 * +  "forLaTeX" BOOL NOT NULL DEFAULT FALSE,
 * +  "approved" BOOL NOT NULL DEFAULT FALSE,
 * +  "altTerms" TEXT[] NOT NULL DEFAULT '{}',
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB,
 * +  "contents" JSONB,
 * +  "contents_latest" TEXT
 * +);
 * +
 * +-- Index "idx_JargonTerms_schemaVersion", hash 3dc15f8e1aa954b5790cf26d2425615c
 * +CREATE INDEX IF NOT EXISTS "idx_JargonTerms_schemaVersion" ON "JargonTerms" USING btree ("schemaVersion");
 * +
 *  -- Table "LWEvents", hash d2758469185cd83bd1feb55c069a1a4f
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "9bff3fcce056471127ba9282be7be567";

import JargonTerms from "@/lib/collections/jargonTerms/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, JargonTerms);
  await updateIndexes(JargonTerms);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, JargonTerms);
}
