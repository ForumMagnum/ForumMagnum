import ResearchConversations from "@/server/collections/researchConversations/collection";
import ResearchDocuments from "@/server/collections/researchDocuments/collection";
import Users from "@/server/collections/users/collection";
import { randomId } from "@/lib/random";

/**
 * Dev-only: insert a bare conversation row so sidebar/chat-view UI (file
 * browser, status dots, rename) can be exercised without provisioning a live
 * sandbox. The conversation has no events and no sandbox, so the file browser
 * shows its "not running" empty state. Run from the sandbox worktree:
 * yarn repl dev lw packages/lesswrong/scripts/seedResearchConversationFixture.ts "seedResearchConversationFixture('<projectId>')"
 */
export async function seedResearchConversationFixture(projectId: string) {
  const user = await Users.findOne({ username: "agent-test" });
  if (!user) {
    // eslint-disable-next-line no-console
    console.log("agent-test user not found");
    return;
  }
  // entrypointDocumentId is NOT NULL — attach to any document in the project.
  const doc = await ResearchDocuments.findOne({ projectId });
  if (!doc) {
    // eslint-disable-next-line no-console
    console.log(`No document in project ${projectId} — create one first`);
    return;
  }
  const _id = randomId();
  const now = new Date();
  await ResearchConversations.rawInsert({
    _id,
    userId: user._id,
    projectId,
    entrypointKind: "document",
    entrypointDocumentId: doc._id,
    icon: null,
    baseEnvironmentId: null,
    runtime: null,
    title: "Fixture conversation",
    claudeSessionId: `fixture-${_id}`,
    presentationHtml: null,
    lastActivityAt: now,
    lastReadAt: now,
    createdAt: now,
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded conversation ${_id} in project ${projectId}`);
}
