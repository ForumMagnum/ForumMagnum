import type { LlmFamilyVersion } from "@/lib/languageModels/llmRegistry";
import { llmReplyPendingMarkdown } from "@/lib/llmReplies/helpers";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { captureException } from "@/lib/sentryWrapper";
import { createComment } from "@/server/collections/comments/mutations";
import LlmRuns from "@/server/collections/llmRuns/collection";
import { commentIsPubliclyVisible } from "@/server/languageModels/publicVisibility";
import { requestLlmRun } from "@/server/languageModels/requestLlmRun";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getFirstMentionedLlm } from "./mentionedLlms";
import { LLM_REPLY_SYSTEM_PROMPT } from "./systemPrompt";

const MIN_KARMA_TO_SUMMON_LLM = 50;

export async function startLlmReplyForComment(comment: DbComment, context: ResolverContext): Promise<void> {
  try {
    const { postId } = comment;
    if (!postId) {
      return;
    }
    const summoned = await getSummonedLlm(comment, context);
    if (summoned) {
      await startLlmReply({ comment, postId, ...summoned }, context);
    }
  } catch (err) {
    captureException(err);
  }
}

async function getSummonedLlm(comment: DbComment, context: ResolverContext): Promise<{ modelUser: DbUser, llm: LlmFamilyVersion } | null> {
  const { currentUser, forumType } = context;
  // Model accounts can't summon models, which also stops reply loops
  if (!currentUser || currentUser.llmFamily || comment.draft) {
    return null;
  }
  if (!userIsAdmin(currentUser) && currentUser.karma < MIN_KARMA_TO_SUMMON_LLM) {
    return null;
  }

  const llm = getFirstMentionedLlm(comment.contents?.html ?? "", forumType);
  if (!llm || !(await commentIsPubliclyVisible(comment, context))) {
    return null;
  }
  const modelUser = await context.Users.findOne({ llmFamily: llm.family.name });
  if (!modelUser) {
    throw new Error(`${llm.family.name} has no account; run createLlmFamilyAccounts`);
  }
  return { modelUser, llm };
}

async function startLlmReply({ comment, postId, modelUser, llm }: {
  comment: DbComment,
  postId: string,
  modelUser: DbUser,
  llm: LlmFamilyVersion,
}, context: ResolverContext): Promise<void> {
  const runId = await LlmRuns.rawInsert({
    createdAt: new Date(),
    invocationContext: "commentReply",
    modelName: llm.version.name,
    gatewayModelId: llm.version.gatewayModelId,
    status: "pending",
    systemPrompt: LLM_REPLY_SYSTEM_PROMPT,
    contextMessage: null,
    transcript: [],
    response: null,
    error: null,
    attemptCount: 0,
    claimedAt: null,
    completedAt: null,
    triggerCommentId: comment._id,
  });

  const modelContext = computeContextFromUser({ user: modelUser, isSSR: false, forumType: context.forumType });
  await createComment({
    data: {
      postId,
      parentCommentId: comment._id,
      contents: {
        originalContents: { type: "markdown", data: llmReplyPendingMarkdown(llm.version.name, runId) },
      },
      llmRunId: runId,
    },
  }, modelContext);

  backgroundTask(requestLlmRun(runId, context.forumType));
}
