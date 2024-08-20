import LlmConversations from "@/lib/collections/llmConversations/collection";
import LlmMessages from "@/lib/collections/llmMessages/collection";
import { createTable, updateIndexes, dropTable } from "./meta/utils";

/**
 * Generated on 2024-08-20T22:37:44.882Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 5dff046abe..0bf42b4bce 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d2ff8b556fc6f740b2bb57ddf5347f64
 * -
 * --- Accepted on 2024-07-29T18:30:41.000Z by 20240729T183041.normalize_post_contents.ts
 * +-- Overall schema hash: c6020749c5f6d763f55d80fdee76e131
 *  
 * @@ -1011,2 +1009,38 @@ CREATE INDEX IF NOT EXISTS "idx_LegacyData_objectId" ON "LegacyData" USING btree
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
 * +-- Index "idx_LlmConversations_userId", hash 7de7b156c25d9b982133f645c39b52d6
 * +CREATE INDEX IF NOT EXISTS "idx_LlmConversations_userId" ON "LlmConversations" USING btree ("userId");
 * +
 * +-- Table "LlmMessages", hash d2044e40c1769dd539e1d852657cd5b0
 * +CREATE TABLE "LlmMessages" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "userId" TEXT NOT NULL,
 * +  "conversationId" TEXT NOT NULL,
 * +  "role" TEXT NOT NULL,
 * +  "type" TEXT NOT NULL,
 * +  "content" TEXT NOT NULL,
 * +  "modifiedContent" TEXT,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB
 * +);
 * +
 * +-- Index "idx_LlmMessages_schemaVersion", hash 48d3194106cf47961652be494df487bb
 * +CREATE INDEX IF NOT EXISTS "idx_LlmMessages_schemaVersion" ON "LlmMessages" USING btree ("schemaVersion");
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
export const acceptsSchemaHash = "c6020749c5f6d763f55d80fdee76e131";

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
