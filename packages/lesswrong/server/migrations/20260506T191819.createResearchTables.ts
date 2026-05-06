import ResearchProjects from "../collections/researchProjects/collection";
import ResearchDocuments from "../collections/researchDocuments/collection";
import ResearchConversations from "../collections/researchConversations/collection";
import ResearchConversationEvents from "../collections/researchConversationEvents/collection";
import ResearchSandboxSessions from "../collections/researchSandboxSessions/collection";
import { createTable, dropTable } from "./meta/utils";

/**
 * Create the five research-workspace tables. Order matters because of FK
 * references:
 *   - ResearchProjects has no research-side FKs; created first.
 *   - ResearchDocuments, ResearchConversations, ResearchSandboxSessions all
 *     reference ResearchProjects.
 *   - ResearchConversationEvents references ResearchConversations.
 */
export const up = async ({ db }: MigrationContext) => {
  await createTable(db, ResearchProjects);
  await createTable(db, ResearchDocuments);
  await createTable(db, ResearchConversations);
  await createTable(db, ResearchSandboxSessions);
  await createTable(db, ResearchConversationEvents);
  await db.none(`
    CREATE UNIQUE INDEX IF NOT EXISTS "idx_ResearchConversationEvents_conversationId_claudeMessageUuid"
    ON "ResearchConversationEvents" ("conversationId", "claudeMessageUuid")
    WHERE "claudeMessageUuid" IS NOT NULL
  `);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, ResearchConversationEvents);
  await dropTable(db, ResearchSandboxSessions);
  await dropTable(db, ResearchConversations);
  await dropTable(db, ResearchDocuments);
  await dropTable(db, ResearchProjects);
};
