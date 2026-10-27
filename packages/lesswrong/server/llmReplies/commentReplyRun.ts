import { createGateway, type LanguageModel } from "ai";
import { getLlmVersionFullName } from "@/lib/languageModels/llmRegistry";
import { llmReplyFailedMarkdown } from "@/lib/llmReplies/helpers";
import { sendNewCommentNotifications } from "@/server/callbacks/commentCallbackFunctions";
import Comments from "@/server/collections/comments/collection";
import { updateComment } from "@/server/collections/comments/mutations";
import Posts from "@/server/collections/posts/collection";
import Users from "@/server/collections/users/collection";
import { generateLlmRunResponse } from "@/server/languageModels/llmRunResponse";
import { getLlmTools } from "@/server/languageModels/llmTools";
import { commentIsPubliclyVisible } from "@/server/languageModels/publicVisibility";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getLlmReplyHtml } from "./llmReplyHtml";
import { buildThreadContextMessage } from "./threadContext";

export async function runCommentReply(run: DbLlmRun): Promise<void> {
  const replyComment = await getReplyComment(run);
  const context = await getModelAccountContext(replyComment);
  const { triggerComment, post } = await getTriggerCommentAndPost(run);
  if (!(await commentIsPubliclyVisible(triggerComment, context))) {
    throw new Error("The comment that mentioned the model is no longer publicly visible");
  }

  const response = await generateLlmRunResponse(run, {
    model: getLlmReplyModel(run.gatewayModelId),
    contextMessage: await buildThreadContextMessage(post, triggerComment, context),
    tools: getLlmTools(context),
  });
  const reply = await updateComment({
    selector: { _id: replyComment._id },
    data: { contents: { originalContents: { type: "html", data: getLlmReplyHtml(getLlmVersionFullName(run.modelName), response) } } },
  }, context);
  backgroundTask(sendNewCommentNotifications(reply, context));
}

export async function failCommentReply(run: DbLlmRun): Promise<void> {
  const replyComment = await getReplyComment(run);
  await updateComment({
    selector: { _id: replyComment._id },
    data: { contents: { originalContents: { type: "markdown", data: llmReplyFailedMarkdown(getLlmVersionFullName(run.modelName), run._id) } } },
  }, await getModelAccountContext(replyComment));
}

function getLlmReplyModel(gatewayModelId: string): LanguageModel {
  const apiKey = process.env.LLM_REPLIES_AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_REPLIES_AI_GATEWAY_API_KEY must be set to run LLM replies");
  }
  return createGateway({ apiKey })(gatewayModelId);
}

async function getReplyComment(run: DbLlmRun): Promise<DbComment> {
  const replyComment = await Comments.findOne({ llmRunId: run._id });
  if (!replyComment) {
    throw new Error(`Run ${run._id} has no reply comment`);
  }
  return replyComment;
}

async function getTriggerCommentAndPost(run: DbLlmRun): Promise<{ triggerComment: DbComment, post: DbPost }> {
  const triggerComment = run.triggerCommentId ? await Comments.findOne({ _id: run.triggerCommentId }) : null;
  if (!triggerComment?.postId) {
    throw new Error(`Run ${run._id} has no trigger comment on a post`);
  }
  const post = await Posts.findOne({ _id: triggerComment.postId });
  if (!post) {
    throw new Error(`Post ${triggerComment.postId} doesn't exist`);
  }
  return { triggerComment, post };
}

async function getModelAccountContext(replyComment: DbComment): Promise<ResolverContext> {
  const modelUser = await Users.findOne({ _id: replyComment.userId });
  if (!modelUser) {
    throw new Error(`Model account ${replyComment.userId} doesn't exist`);
  }
  return computeContextFromUser({ user: modelUser, isSSR: false, forumType: "LessWrong" });
}
