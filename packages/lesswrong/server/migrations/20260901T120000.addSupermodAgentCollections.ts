import ModerationAgentConversations from "@/server/collections/moderationAgentConversations/collection";
import ModerationLoreDocs from "@/server/collections/moderationLoreDocs/collection";
import ModerationProposals from "@/server/collections/moderationProposals/collection";
import ModerationSummaries from "@/server/collections/moderationSummaries/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ModerationAgentConversations);
  await createTable(db, ModerationLoreDocs);
  await createTable(db, ModerationProposals);
  await createTable(db, ModerationSummaries);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ModerationSummaries);
  await dropTable(db, ModerationProposals);
  await dropTable(db, ModerationLoreDocs);
  await dropTable(db, ModerationAgentConversations);
}
