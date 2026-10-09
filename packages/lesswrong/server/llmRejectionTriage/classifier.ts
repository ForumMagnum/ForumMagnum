import { generateText, Output } from "ai";
import { z } from "zod";
import { compile } from "html-to-text";
import { captureException } from "@/lib/sentryWrapper";

const LLM_REJECTION_TRIAGE_MODEL = "anthropic/claude-sonnet-5.5";

const LLM_REJECTION_TRIAGE_SYSTEM_PROMPT = `You'll be shown a new LessWrong user's bio and their posts and comments. Some of their content was automatically rejected because Pangram, an AI-writing detector, flagged it as LLM-written.

Answer keep_for_review only if this really seems like pretty fine, good, useful human content despite what Pangram said. The bar for keep_for_review is high.

Content translated into English by an LLM counts as LLM-written. Translation is not a reason to answer keep_for_review.

Answer spam if the content exists to promote a product, service, SEO link-building or website unrelated to LessWrong rather than to take part in discussion. "Escorts in Dubai", "Certification services", "Exam help", "lawnmower services in Adelaide Australia" are examples. Links are suspicious, however there are some exceptions, e.g. someone promoting e.g. a forecasting tool, other epistemic tool, grantmaking, or a fellowship related to LessWrong activities is relevant to LessWrong and not necessarily spam. The promotions that are bad are unrelated commercial products or services. Spam content might be in the user bio or in their submissions, either is a reason to classify as spam.

If someone repeatedly posts content promoting things that wouldn't be spam, answer keep_for_review so a moderator can review it manually, even if the content otherwise looks LLM-written.

Otherwise answer remove.

Answer with a verdict and a one-sentence reason.
Verdicts:
- remove
- keep_for_review
- spam`;

const llmRejectionTriageVerdictSchema = z.object({
  verdict: z.enum(["remove", "keep_for_review", "spam"]),
  reason: z.string(),
});

export type LlmRejectionTriageVerdict = z.infer<typeof llmRejectionTriageVerdictSchema>;

export type LlmRejectionTriageItemStatus = "auto-rejected" | "rejected by moderator" | "live" | "deleted";

export interface LlmRejectionTriageItem {
  kind: "Post" | "Comment";
  postedAt: Date;
  status: LlmRejectionTriageItemStatus;
  title: string | null;
  replyingTo: string | null;
  pangramScore: number | null;
  html: string;
}

export interface LlmRejectionTriageInput {
  displayName: string;
  createdAt: Date;
  bioHtml: string | null;
  items: LlmRejectionTriageItem[];
}

const MAX_AUTO_REJECTED_ITEMS = 10;
const MAX_AUTO_REJECTED_ITEM_WORDS = 4000;
const MAX_OTHER_ITEMS = 20;
const MAX_OTHER_ITEM_WORDS = 1000;

const htmlToText = compile({ wordwrap: false });

function truncateToWords(text: string, maxWords: number): string {
  const wordRegex = /\S+/g;
  let wordCount = 0;
  let cutIndex: number | null = null;
  for (let match = wordRegex.exec(text); match; match = wordRegex.exec(text)) {
    wordCount++;
    if (wordCount === maxWords) {
      cutIndex = match.index + match[0].length;
    }
  }
  if (cutIndex === null || wordCount === maxWords) return text;
  return `${text.slice(0, cutIndex)}\n[Truncated: showing ${maxWords} of ${wordCount} words]`;
}

function formatItem(item: LlmRejectionTriageItem): string {
  const isAutoRejected = item.status === "auto-rejected";
  const lines = [`--- ${item.kind} (${item.postedAt.toISOString()}) [${item.status}] ---`];
  if (item.kind === "Post") lines.push(`Title: ${item.title ?? "(none)"}`);
  if (item.kind === "Comment") lines.push(`Replying to: ${item.replyingTo ?? "(unknown post)"}`);
  lines.push(`Pangram score: ${item.pangramScore === null ? "not checked" : item.pangramScore.toFixed(2)}`);
  lines.push(truncateToWords(htmlToText(item.html).trim(), isAutoRejected ? MAX_AUTO_REJECTED_ITEM_WORDS : MAX_OTHER_ITEM_WORDS));
  return lines.join("\n");
}

export function buildLlmRejectionTriagePrompt(input: LlmRejectionTriageInput): string {
  const newestFirst = [...input.items].sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
  const autoRejected = newestFirst.filter(item => item.status === "auto-rejected");
  const other = newestFirst.filter(item => item.status !== "auto-rejected");
  const shown = new Set([...autoRejected.slice(0, MAX_AUTO_REJECTED_ITEMS), ...other.slice(0, MAX_OTHER_ITEMS)]);

  const omittedAutoRejected = Math.max(0, autoRejected.length - MAX_AUTO_REJECTED_ITEMS);
  const omittedOther = Math.max(0, other.length - MAX_OTHER_ITEMS);
  const omittedNote = omittedAutoRejected || omittedOther
    ? [`[Omitted: ${omittedAutoRejected} older auto-rejected items and ${omittedOther} older other items]`]
    : [];

  return [
    `Display name: ${input.displayName}`,
    `Account created: ${input.createdAt.toISOString()}`,
    `Bio:\n${htmlToText(input.bioHtml ?? "").trim() || "(none)"}`,
    ...newestFirst.filter(item => shown.has(item)).map(formatItem),
    ...omittedNote,
  ].join("\n\n");
}

export async function classifyLlmRejectedUser(input: LlmRejectionTriageInput): Promise<LlmRejectionTriageVerdict | null> {
  try {
    const result = await generateText({
      model: LLM_REJECTION_TRIAGE_MODEL,
      system: LLM_REJECTION_TRIAGE_SYSTEM_PROMPT,
      prompt: buildLlmRejectionTriagePrompt(input),
      output: Output.object({ schema: llmRejectionTriageVerdictSchema }),
      maxOutputTokens: 4000,
    });
    return result.output;
  } catch (err) {
    // Refusals also throw here, since they produce no output.
    captureException(err);
    return null;
  }
}
