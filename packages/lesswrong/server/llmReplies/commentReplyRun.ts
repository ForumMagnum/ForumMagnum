import type { ForumTypeString } from "@/lib/instanceSettings";
import { llmReplyFailedMarkdown } from "@/lib/llmReplies/helpers";
import { sendLlmReplyNotifications } from "@/server/callbacks/commentCallbackFunctions";
import Comments from "@/server/collections/comments/collection";
import { updateComment } from "@/server/collections/comments/mutations";
import Posts from "@/server/collections/posts/collection";
import Users from "@/server/collections/users/collection";
import type { LlmRunHandler } from "@/server/languageModels/llmRuns";
import { generateLlmRunResponse } from "@/server/languageModels/llmRunResponse";
import { getLlmTools } from "@/server/languageModels/llmTools";
import { commentIsPubliclyVisible } from "@/server/languageModels/publicVisibility";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { buildThreadContextMessage } from "./threadContext";

/**
 * Comment replies: the model reads the thread, and its response replaces the
 * placeholder reply created when it was mentioned. The new-comment
 * notifications go out at that point, rather than for the placeholder.
 */
export const commentReplyRunHandler: LlmRunHandler = {
  run: async (run, forumType) => {
    const { replyCommentId, triggerCommentId, postId } = run;
    if (!replyCommentId || !triggerCommentId || !postId) {
      throw new Error(`Comment reply run ${run._id} is missing its comments or post`);
    }
    const context = await getModelAccountContext(run, forumType);
    const [triggerComment, post] = await Promise.all([
      Comments.findOne({ _id: triggerCommentId }),
      Posts.findOne({ _id: postId }),
    ]);
    if (!triggerComment || !post || !(await commentIsPubliclyVisible(triggerComment, context))) {
      throw new Error("The comment that mentioned the model is no longer publicly visible");
    }

    const response = await generateLlmRunResponse(run, {
      contextMessage: await buildThreadContextMessage(post, triggerComment, context),
      tools: getLlmTools(context, run.gatewayModelId),
    });
    const reply = await updateComment({
      selector: { _id: replyCommentId },
      data: { contents: { originalContents: { type: "markdown", data: response } } },
    }, context);
    await sendLlmReplyNotifications(reply, context);
  },

  fail: async (run, forumType) => {
    if (!run.replyCommentId) {
      return;
    }
    await updateComment({
      selector: { _id: run.replyCommentId },
      data: { contents: { originalContents: { type: "markdown", data: llmReplyFailedMarkdown(run.modelName, run._id) } } },
    }, await getModelAccountContext(run, forumType));
  },
};

async function getModelAccountContext(run: DbLlmRun, forumType: ForumTypeString): Promise<ResolverContext> {
  const modelUser = run.modelUserId ? await Users.findOne({ _id: run.modelUserId }) : null;
  if (!modelUser) {
    throw new Error(`Model account ${run.modelUserId} for run ${run._id} doesn't exist`);
  }
  return computeContextFromUser({ user: modelUser, isSSR: false, forumType });
}
