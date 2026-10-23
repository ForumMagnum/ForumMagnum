import { llmRunGetPageUrl } from "@/lib/collections/llmRuns/helpers";

const LLM_REPLY_EXPAND_KARMA = 10;

export function llmReplyStartsAsPreview(comment: { llmRunId: string | null, baseScore: number | null }): boolean {
  return !!comment.llmRunId && (comment.baseScore ?? 0) < LLM_REPLY_EXPAND_KARMA;
}

export function llmReplyPendingMarkdown(versionName: string, runId: string): string {
  return `*${versionName} is writing a reply. [Follow along](${llmRunGetPageUrl(runId)}).*`;
}

export function llmReplyFailedMarkdown(versionName: string, runId: string): string {
  return `*${versionName} couldn't finish this reply. [See what happened](${llmRunGetPageUrl(runId)}).*`;
}
