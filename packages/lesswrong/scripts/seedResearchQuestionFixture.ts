import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { randomId } from "@/lib/random";

/**
 * Dev-only: seed AskUserQuestion transcript events into a conversation so the
 * question card UI can be exercised without a live sandbox. Pass `answered` to
 * also seed the resolving tool_result (read-only answered state); otherwise the
 * question renders pending (interactive; submitting hits the expired path
 * since there's no running sandbox). Run from the sandbox worktree:
 *   yarn repl dev lw packages/lesswrong/scripts/seedResearchQuestionFixture.ts \
 *     "seedResearchQuestionFixture('<conversationId>', false)"
 */
export async function seedResearchQuestionFixture(conversationId: string, answered = false) {
  const context = createAdminContext();
  const toolUseId = `toolu_${randomId()}`;

  const questions = [
    {
      question: "Which auth approach should we use?",
      header: "Auth",
      multiSelect: false,
      options: [
        { label: "Session cookies", description: "Server-side sessions with an httpOnly cookie" },
        { label: "JWT", description: "Stateless bearer tokens" },
        { label: "OAuth only", description: "Delegate entirely to third-party providers" },
      ],
    },
    {
      question: "Which environments should this ship to first?",
      header: "Rollout",
      multiSelect: true,
      options: [
        { label: "Dev" },
        { label: "Staging" },
        { label: "Prod" },
      ],
    },
  ];

  await context.repos.researchConversationEvents.persistEvent(conversationId, {
    claudeMessageUuid: `seed-ask-${toolUseId}`,
    kind: "assistant",
    payload: {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "tool_use", id: toolUseId, name: "AskUserQuestion", input: { questions } }] },
    },
  });

  if (answered) {
    const answers = { [questions[0].question]: "JWT", [questions[1].question]: "Dev, Staging" };
    await context.repos.researchConversationEvents.persistEvent(conversationId, {
      claudeMessageUuid: `seed-ans-${toolUseId}`,
      kind: "tool_result",
      payload: {
        type: "user",
        message: { role: "user", content: [{ type: "tool_result", tool_use_id: toolUseId, content: "Your questions have been answered." }] },
        tool_use_result: { questions, answers },
      },
    });
    // A terminal result so the pending question isn't read as an in-flight turn.
    await context.repos.researchConversationEvents.persistEvent(conversationId, {
      claudeMessageUuid: `seed-res-${toolUseId}`,
      kind: "result",
      payload: { type: "result", subtype: "success", is_error: false, result: "Done." },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${answered ? "answered" : "pending"} question ${toolUseId} into ${conversationId}`);
}
