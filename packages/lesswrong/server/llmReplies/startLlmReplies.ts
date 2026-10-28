import { llmMentionsEnabledSetting } from "@/lib/instanceSettings";
import { getLlmFamilyBySlug, type LlmFamilyVersion } from "@/lib/languageModels/llmRegistry";
import { llmReplyPendingMarkdown } from "@/lib/llmReplies/helpers";
import { userMentionQueryString } from "@/lib/pingback";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { randomId } from "@/lib/random";
import { createComment } from "@/server/collections/comments/mutations";
import LlmRuns from "@/server/collections/llmRuns/collection";
import { dataToHTML } from "@/server/editor/conversionUtils";
import { commentIsPubliclyVisible, postIsPubliclyVisible } from "@/server/permissions/accessFilters";
import { requestLlmRun } from "@/server/languageModels/requestLlmRun";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getLlmReplyHtml } from "./llmReplyHtml";
import { getFirstMentionedLlm } from "./mentionedLlms";
import { failCommentReply } from "./commentReplyRun";

const MIN_KARMA_TO_SUMMON_LLM = 50;
const LLM_REPLY_LIMIT_AT_MIN_KARMA = 3;
const LLM_REPLY_LIMIT_PER_KARMA_DOUBLING = 2.4;
const LLM_REPLY_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const LLM_REPLY_SYSTEM_PROMPT = `You're replying to a comment on LessWrong. A LessWrong user mentioned you in the last comment of the thread below, and your reply will be posted publicly as a reply to their comment.

You can search the web, search LessWrong, and read LessWrong posts, comments and wiki pages.

Keep your reply short: usually one to three paragraphs, under about 400 words. Content beyond this will require a user to click through to a separate page (few will) so please respect the length guidance, unless it's really necessary.

Write your reply in Markdown. Your final message is posted as the reply.
`;

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
    await startLlmReply({ comment, postId, modelUser: check.modelUser, llm });
  }
}

async function checkLlmSummon(currentUser: DbUser, postId: string | null, llm: LlmFamilyVersion, context: ResolverContext): Promise<LlmSummonCheck> {
  const modelName = llm.version.fullName;
  if (!llmMentionsEnabledSetting.get(context)) {
    return { allowed: false, reason: "LLM replies are currently turned off." };
  }
  if (!postId) {
    return { allowed: false, reason: `${modelName} only replies to comments on posts.` };
  }
  if (!userIsAdmin(currentUser)) {
    if (currentUser.karma < MIN_KARMA_TO_SUMMON_LLM) {
      return { allowed: false, reason: `You need ${MIN_KARMA_TO_SUMMON_LLM} karma to get a reply from an LLM.` };
    }
    const replyLimit = getLlmReplyLimit(currentUser.karma);
    const recentReplyCount = await context.repos.llmRuns.countRunsTriggeredByUserSince(currentUser._id, new Date(Date.now() - LLM_REPLY_LIMIT_WINDOW_MS));
    if (recentReplyCount >= replyLimit) {
      return { allowed: false, reason: `You've reached your limit of ${replyLimit} LLM replies per 24 hours.` };
    }
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

function getLlmReplyLimit(karma: number): number {
  return LLM_REPLY_LIMIT_AT_MIN_KARMA + Math.floor(LLM_REPLY_LIMIT_PER_KARMA_DOUBLING * Math.log2(karma / MIN_KARMA_TO_SUMMON_LLM));
}

async function startLlmReply({ comment, postId, modelUser, llm }: {
  comment: DbComment,
  postId: string,
  modelUser: DbUser,
  llm: LlmFamilyVersion,
}): Promise<void> {
  const runId = randomId();
  const run: InsertionRecord<DbLlmRun> = {
    _id: runId,
    createdAt: new Date(),
    invocationContext: "commentReply",
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
  };

  const modelContext = computeContextFromUser({ user: modelUser, isSSR: false, forumType: "LessWrong" });
  try {
    await LlmRuns.rawInsert(run);
    await createComment({
      data: {
        postId,
        parentCommentId: comment._id,
        af: comment.af,
        contents: {
          originalContents: { type: "html", data: getLlmReplyHtml(llm.version.fullName, llmReplyPendingMarkdown(llm.version.fullName, runId)) },
        },
        llmRunId: runId,
      },
    }, modelContext);
  } catch (err) {
    await LlmRuns.rawUpdateOne({ _id: runId, status: "pending", attemptCount: 0 }, {
      $set: { status: "failed", completedAt: new Date(), error: err instanceof Error ? err.message : String(err) },
    });
    const storedRun = await LlmRuns.findOne(runId);
    if (storedRun && await modelContext.Comments.findOne({ llmRunId: runId })) {
      await failCommentReply(storedRun);
    }
    throw err;
  }

  backgroundTask(requestLlmRun(runId));
}
