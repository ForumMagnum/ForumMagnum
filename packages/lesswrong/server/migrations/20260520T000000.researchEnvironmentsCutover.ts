import ResearchProjects from "../collections/researchProjects/collection";
import ResearchDocuments from "../collections/researchDocuments/collection";
import ResearchConversations from "../collections/researchConversations/collection";
import ResearchConversationEvents from "../collections/researchConversationEvents/collection";
import ResearchSandboxSessions from "../collections/researchSandboxSessions/collection";
import ResearchEnvironments from "../collections/researchEnvironments/collection";
import SandboxBaselineSnapshots from "../collections/sandboxBaselineSnapshots/collection";
import Users from "../collections/users/collection";
import { createTable, addField } from "./meta/utils";

/**
 * Watch-item: the final collection schemas must not declare an index on
 * `baseEnvironmentId`/`runtime`, because `createTable` also runs `updateIndexes`
 * on the skipped existing `ResearchConversations` table (which lacks those
 * columns until the reconciliation adds them). They are not indexed.
 *
 * The one-off dev-DB reconciliation that runs after this migration lives in
 * `server/scripts/reconcileResearchEnvironmentsCutover.ts` (run via `yarn repl`).
 */
export const up = async ({ db }: MigrationContext) => {
  await createTable(db, ResearchProjects);
  await createTable(db, ResearchDocuments);
  await createTable(db, ResearchConversations);
  await createTable(db, ResearchConversationEvents);
  await createTable(db, ResearchSandboxSessions);
  await createTable(db, ResearchEnvironments);
  await createTable(db, SandboxBaselineSnapshots);

  await addField(db, Users, "claudeCodeOAuthTokenEncrypted");
};
