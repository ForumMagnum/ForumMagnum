/**
 * Generated on 2024-09-25T02:00:54.482Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * index 6d80312ecc..e6d16060a1 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 16016945b35edcc8c5df47e292005a22
 * -
 * --- Accepted on 2024-09-21T20:26:11.000Z by 20240921T202611.ensure_Manifold_url_column_is_nullable.ts
 * +-- Overall schema hash: 4176699fcd50a096b6fd2437aec71b01
 *  
 * @@ -1272,2 +1270,19 @@ CREATE INDEX IF NOT EXISTS "idx_PageCache_path_bundleHash_expiresAt" ON "PageCac
 *  
 * +-- Table "PetrovDayActions", hash 031c9fa2d97a655a152cd23173728603
 * +CREATE TABLE "PetrovDayActions" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "actionType" TEXT NOT NULL,
 * +  "data" JSONB,
 * +  "userId" TEXT,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB
 * +);
 * +
 * +-- Index "idx_PetrovDayActions_schemaVersion", hash 183f959073976d2a51d1e8e2d4962071
 * +CREATE INDEX IF NOT EXISTS "idx_PetrovDayActions_schemaVersion" ON "PetrovDayActions" USING btree ("schemaVersion");
 * +
 * +-- Index "idx_PetrovDayActions_userId_actionType", hash 0d7298d33a012a9386eb4538ad76688c
 * +CREATE INDEX IF NOT EXISTS "idx_PetrovDayActions_userId_actionType" ON "PetrovDayActions" USING btree ("userId", "actionType");
 * +
 *  -- Table "PetrovDayLaunchs", hash eafdfff5f5555a3913604e69921da599
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4176699fcd50a096b6fd2437aec71b01";

import { PetrovDayActions } from "../../lib/collections/petrovDayActions/collection"
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, PetrovDayActions)
  await updateIndexes(PetrovDayActions);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, PetrovDayActions);
}
