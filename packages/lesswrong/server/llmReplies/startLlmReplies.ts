import { getLlmFamilyBySlug, type LlmFamilyVersion } from "@/lib/languageModels/llmRegistry";
import { llmReplyPendingMarkdown } from "@/lib/llmReplies/helpers";
import { userMentionQueryString } from "@/lib/pingback";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { createComment } from "@/server/collections/comments/mutations";
import LlmRuns from "@/server/collections/llmRuns/collection";
import { dataToHTML } from "@/server/editor/conversionUtils";
import { commentIsPubliclyVisible, postIsPubliclyVisible } from "@/server/languageModels/publicVisibility";
import { requestLlmRun } from "@/server/languageModels/requestLlmRun";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getLlmReplyHtml } from "./llmReplyHtml";
import { getFirstMentionedLlm } from "./mentionedLlms";
import { LLM_REPLY_SYSTEM_PROMPT } from "./systemPrompt";

const MIN_KARMA_TO_SUMMON_LLM = 50;

type LlmSummonCheck =
  | { allowed: true, modelUser: DbUser }
  | { allowed: false, reason: string };

interface SubmittedContents {
  type: string,
  data: unknown,
}

export async function assertSubmittedLlmMentionAllowed(postId: string | null, originalContents: SubmittedContents | null | undefined, context: ResolverContext): Promise<void> {
  if (!originalContents || !JSON.stringify(originalContents.data).includes(userMentionQueryString)) {
    return;
  }
  const html = await dataToHTML(originalContents.data, originalContents.type, context, { sanitize: true, skipMathjax: true });
  await assertLlmMentionAllowed(postId, html, context);
}

export async function assertLlmMentionAllowed(postId: string | null, html: string, context: ResolverContext): Promise<void> {
  const { currentUser, forumType } = context;
  if (!currentUser || getLlmFamilyBySlug(currentUser.slug)) {
    return;
  }
  const llm = getFirstMentionedLlm(html, forumType);
  if (!llm) {
    return;
  }
  const check = await checkLlmSummon(currentUser, postId, llm, context);
  if (!check.allowed) {
    throw new Error(`${check.reason} Remove the @${llm.version.fullName} mention to post without a reply.`);
  }
}

export async function startLlmReplyForComment(comment: DbComment, context: ResolverContext): Promise<void> {
  const { currentUser, forumType } = context;
  const { postId } = comment;
  // Model accounts can't summon models, which also stops reply loops
  if (!currentUser || getLlmFamilyBySlug(currentUser.slug) || comment.draft || !postId) {
    return;
  }
  const llm = getFirstMentionedLlm(comment.contents?.html ?? "", forumType);
  if (!llm || !(await commentIsPubliclyVisible(comment, context))) {
    return;
  }
  const check = await checkLlmSummon(currentUser, postId, llm, context);
  if (check.allowed) {
    await startLlmReply({ comment, postId, modelUser: check.modelUser, llm }, context);
  }
}

async function checkLlmSummon(currentUser: DbUser, postId: string | null, llm: LlmFamilyVersion, context: ResolverContext): Promise<LlmSummonCheck> {
  const modelName = llm.version.fullName;
  if (!postId) {
    return { allowed: false, reason: `${modelName} only replies to comments on posts.` };
  }
  if (!userIsAdmin(currentUser) && currentUser.karma < MIN_KARMA_TO_SUMMON_LLM) {
    return { allowed: false, reason: `You need ${MIN_KARMA_TO_SUMMON_LLM} karma to get a reply from an LLM.` };
  }
  const post = await context.loaders.Posts.load(postId);
  if (!post || !(await postIsPubliclyVisible(post, context))) {
    return { allowed: false, reason: `${modelName} only replies on posts that anyone can read.` };
  }
  const modelUser = await context.Users.findOne({ slug: llm.family.accountSlug });
  if (!modelUser) {
    return { allowed: false, reason: `${modelName} isn't available on this site.` };
  }
  return { allowed: true, modelUser };
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
    forumType: context.forumType,
    modelName: llm.version.name,
    gatewayModelId: llm.version.gatewayModelId,
    status: "pending",
    systemPrompt: LLM_REPLY_SYSTEM_PROMPT,
    contextMessage: null,
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
        originalContents: { type: "html", data: getLlmReplyHtml(llm.version.fullName, llmReplyPendingMarkdown(runId)) },
      },
      llmRunId: runId,
    },
  }, modelContext);

  backgroundTask(requestLlmRun(runId, context.forumType));
}
