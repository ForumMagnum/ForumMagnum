import { llmRunGetPageUrl } from "@/lib/collections/llmRuns/helpers";
import type { CommentTreeNode } from "@/lib/utils/unflatten";

export function commentHasLlmReply(commentId: string, replies: Array<CommentTreeNode<CommentsList>>): boolean {
  return replies.some(({ item }) => !!item.llmRunId && item.parentCommentId === commentId);
}

export function llmReplyPendingMarkdown(modelName: string, runId: string): string {
  return `*${modelName} is writing a reply. [Follow along](${llmRunGetPageUrl(runId)}).*`;
}

export function llmReplyFailedMarkdown(modelName: string, runId: string): string {
  return `*${modelName} couldn't finish this reply. [See what happened](${llmRunGetPageUrl(runId)}).*`;
}
