import { llmRunGetPageUrl } from "@/lib/collections/llmRuns/helpers";
import { calculateTruncationStatus, truncate } from "@/lib/editor/ellipsize";
import type { CommentTreeNode } from "@/lib/utils/unflatten";

const LLM_REPLY_EXCERPT_WORD_LIMIT = 120;
const LLM_REPLY_EXPANDED_WORD_LIMIT = 480;
const LLM_REPLY_GRACE_WORDS = 20;

export function commentHasLlmReply(commentId: string, replies: Array<CommentTreeNode<CommentsList>>): boolean {
  return replies.some(({ item }) => !!item.llmRunId && item.parentCommentId === commentId);
}

function truncateLlmReply(html: string, wordCount: number, wordLimit: number, readMoreLabel: (moreWords: string) => string): string {
  const { willTruncate, wordsRemaining } = calculateTruncationStatus(wordCount, wordLimit, LLM_REPLY_GRACE_WORDS);
  if (!willTruncate) {
    return html;
  }
  const moreWords = `${wordsRemaining.toLocaleString("en-US")} more words`;
  return truncate(html, wordLimit, "words", `... <span class="read-more-button">${readMoreLabel(moreWords)}</span>`);
}

export function getLlmReplyHtml(comment: CommentsList, llmRunId: string, showExcerpt: boolean, pathname: string): string {
  const html = comment.contents?.html ?? "";
  const wordCount = comment.contents?.wordCount ?? 0;
  if (showExcerpt) {
    return truncateLlmReply(html, wordCount, LLM_REPLY_EXCERPT_WORD_LIMIT, (moreWords) => `(${moreWords})`);
  }
  const runPageUrl = llmRunGetPageUrl(llmRunId);
  if (pathname === runPageUrl) {
    return html;
  }
  return truncateLlmReply(html, wordCount, LLM_REPLY_EXPANDED_WORD_LIMIT, (moreWords) => `<a href="${runPageUrl}">View full output (${moreWords})</a>`);
}

export function llmReplyPendingMarkdown(modelName: string, runId: string): string {
  return `*${modelName} is writing a reply. [Follow along](${llmRunGetPageUrl(runId)}).*`;
}

export function llmReplyFailedMarkdown(modelName: string, runId: string): string {
  return `*${modelName} couldn't finish this reply. [See what happened](${llmRunGetPageUrl(runId)}).*`;
}
