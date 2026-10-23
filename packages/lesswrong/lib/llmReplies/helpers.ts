import { llmRunGetPageUrl } from "@/lib/collections/llmRuns/helpers";

/** Model replies show as a one-line preview until voted up to this karma */
export const LLM_REPLY_EXPAND_KARMA = 10;

export function llmReplyStartsAsPreview(comment: { llmRunId: string | null, baseScore: number | null }): boolean {
  return !!comment.llmRunId && (comment.baseScore ?? 0) < LLM_REPLY_EXPAND_KARMA;
}

/** Contents of a model's reply comment while the model is still writing it */
export function llmReplyPendingMarkdown(versionName: string, runId: string): string {
  return `*${versionName} is writing a reply. [Follow along](${llmRunGetPageUrl(runId)}).*`;
}

/** Contents of a model's reply comment if the model couldn't finish it */
export function llmReplyFailedMarkdown(versionName: string, runId: string): string {
  return `*${versionName} couldn't finish this reply. [See what happened](${llmRunGetPageUrl(runId)}).*`;
}
