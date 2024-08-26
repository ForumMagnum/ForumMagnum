import LlmConversations from "@/lib/collections/llmConversations/collection";
import LlmMessages from "@/lib/collections/llmMessages/collection";
import { createTable, updateIndexes, dropTable } from "./meta/utils";

/**
 * Generated on 2024-08-26T22:29:55.001Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 45c35880ce..301bf54a5d 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: dc66ac034a766a7dd21afb2e072073a3
 * -
 * --- Accepted on 2024-08-20T18:32:33.000Z by 20240820T183233.sidenotesFlag.ts
 * +-- Overall schema hash: 1b522f36535bb2cd26ae4018d17687c3
 *  
 * @@ -1011,2 +1009,39 @@ CREATE INDEX IF NOT EXISTS "idx_LegacyData_objectId" ON "LegacyData" USING btree
 *  
 * +-- Table "LlmConversations", hash 49ad4e83777890bde1310b0ad82b8ac7
 * +CREATE TABLE "LlmConversations" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "userId" TEXT NOT NULL,
 * +  "title" TEXT NOT NULL,
 * +  "model" TEXT NOT NULL,
 * +  "systemPrompt" TEXT,
 * +  "deleted" BOOL NOT NULL DEFAULT FALSE,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB
 * +);
 * +
 * +-- Index "idx_LlmConversations_schemaVersion", hash 3b96d13224f2893a7442d33803f642f7
 * +CREATE INDEX IF NOT EXISTS "idx_LlmConversations_schemaVersion" ON "LlmConversations" USING btree ("schemaVersion");
 * +
 * +-- Index "idx_LlmConversations_userId_deleted_createdAt", hash 0f97075833b4303cd70ba68bad211b40
 * +CREATE INDEX IF NOT EXISTS "idx_LlmConversations_userId_deleted_createdAt" ON "LlmConversations" USING btree ("userId", "deleted", "createdAt");
 * +
 * +-- Table "LlmMessages", hash ee9fdff3b6c57a0f181a318e27231224
 * +CREATE TABLE "LlmMessages" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "userId" TEXT NOT NULL,
 * +  "conversationId" TEXT NOT NULL,
 * +  "role" TEXT NOT NULL,
 * +  "content" TEXT NOT NULL,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB
 * +);
 * +
 * +-- Index "idx_LlmMessages_schemaVersion", hash 48d3194106cf47961652be494df487bb
 * +CREATE INDEX IF NOT EXISTS "idx_LlmMessages_schemaVersion" ON "LlmMessages" USING btree ("schemaVersion");
 * +
 * +-- Index "idx_LlmMessages_conversationId_createdAt", hash 3c88ec3e08ce47617e556decd37e5b38
 * +CREATE INDEX IF NOT EXISTS "idx_LlmMessages_conversationId_createdAt" ON "LlmMessages" USING btree ("conversationId", "createdAt");
 * +
 *  -- Table "Localgroups", hash 87a36302129cba8276af1951481ba426
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "1b522f36535bb2cd26ae4018d17687c3";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, LlmConversations);
  await createTable(db, LlmMessages);
  await updateIndexes(LlmConversations);
  await updateIndexes(LlmMessages);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, LlmMessages);
  await dropTable(db, LlmConversations);
}
