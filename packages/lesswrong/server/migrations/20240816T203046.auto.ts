/**
 * Generated on 2024-08-16T20:30:46.359Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 5dff046abe..e144776252 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d2ff8b556fc6f740b2bb57ddf5347f64
 * -
 * --- Accepted on 2024-07-29T18:30:41.000Z by 20240729T183041.normalize_post_contents.ts
 * +-- Overall schema hash: e805a83c2ba5d229c3383afa6fee8be2
 *  
 * @@ -1011,2 +1009,33 @@ CREATE INDEX IF NOT EXISTS "idx_LegacyData_objectId" ON "LegacyData" USING btree
 *  
 * +-- Table "LlmConversations", hash d2fd93aac4831add71544502ba6e8b02
 * +CREATE TABLE "LlmConversations" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "userId" TEXT NOT NULL,
 * +  "title" TEXT NOT NULL,
 * +  "model" TEXT NOT NULL,
 * +  "systemPrompt" JSONB,
 * +  "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * +  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +  "legacyData" JSONB
 * +);
 * +
 * +-- Index "idx_LlmConversations_schemaVersion", hash 3b96d13224f2893a7442d33803f642f7
 * +CREATE INDEX IF NOT EXISTS "idx_LlmConversations_schemaVersion" ON "LlmConversations" USING btree ("schemaVersion");
 * +
 * +-- Table "LlmMessages", hash 9474b99dd572c20887b20e07d134fa1c
 * +CREATE TABLE "LlmMessages" (
 * +  _id VARCHAR(27) PRIMARY KEY,
 * +  "userId" TEXT NOT NULL,
 * +  "conversationId" TEXT NOT NULL,
 * +  "role" TEXT NOT NULL,
 * +  "type" TEXT NOT NULL,
 * +  "content" JSONB,
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
// export const acceptsSchemaHash = "e805a83c2ba5d229c3383afa6fee8be2";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
