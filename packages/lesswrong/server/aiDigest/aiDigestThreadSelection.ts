import { generateText, Output } from "ai";
import { z } from "zod";
import {
  AI_DIGEST_MODEL_ID,
  aiDigestGatewayProviderOptions,
  aiDigestModelCallRecord,
  aiDigestUserMessage,
  assertAiDigestModelFinished,
  decodeStrayUnicodeEscapes,
} from "./aiDigestModelCalls";
import type { AiDigestReaderProfile } from "./aiDigestReaderProfile";
import type { AiDigestThreadCard, AiDigestThreadCardComment } from "./aiDigestThreadCandidates";
import { AI_DIGEST_THREAD_SELECTION_PROMPT_VERSION, buildAiDigestThreadSelectionPrompt } from "./aiDigestThreadSelectionPrompt";

const MAX_THREADS_PER_ISSUE = 3;
const MAX_REPLIES_PER_THREAD = 2;
/** Anchors and replies shown across all threads; the comments above an anchor don't count. */
const MAX_SHOWN_COMMENTS = 6;
/** How far above the anchor to look for a comment the reader wrote or liked. */
const MAX_CONTEXT_DEPTH = 3;
const REASON_MAX_LENGTH = 180;

const threadSelectionOutputSchema = z.object({
  selectedThreads: z.array(z.object({
    anchorCommentId: z.string(),
    reason: z.string().describe(
      "The true reason this thread was selected for this reader, e.g. \"New "
      + "replies in a thread you commented in\" or an honest inferred-interest "
      + "match. Fall back to the site-wide rationale (e.g. one of the most "
      + "upvoted discussions this week) only when reader signals are too thin "
      + "to ground any connection. Never a synopsis of the thread's contents.",
    ),
  })).max(MAX_THREADS_PER_ISSUE),
});

export interface AiDigestSelectedThread {
  anchorCommentId: string;
  /** Every comment to show, the anchor included. */
  commentIds: string[];
  /** Null when the model's reason was empty or too long to show. */
  reason: string | null;
}

/**
 * The comments leading down to the anchor from the nearest comment above it
 * that the reader wrote or liked, top-down. Empty if there is no such comment
 * within reach, so the anchor is shown on its own.
 */
function contextCommentIds(anchor: AiDigestThreadCardComment, commentsById: Map<string, AiDigestThreadCardComment>): string[] {
  const ancestorIds: string[] = [];
  let ancestor = anchor.parentCommentId ? commentsById.get(anchor.parentCommentId) : undefined;
  while (ancestor && ancestorIds.length < MAX_CONTEXT_DEPTH) {
    ancestorIds.push(ancestor.commentId);
    if (ancestor.authoredByReader || ancestor.liked) {
      return ancestorIds.reverse();
    }
    ancestor = ancestor.parentCommentId ? commentsById.get(ancestor.parentCommentId) : undefined;
  }
  return [];
}

function isUnseenByReader(comment: AiDigestThreadCardComment): boolean {
  return comment.newSinceLastVisit && !comment.seenInFeed;
}

/** The anchor's direct replies, ones the reader hasn't seen first, then by karma. */
function replyIds(card: AiDigestThreadCard, anchorCommentId: string, limit: number): string[] {
  return card.comments
    .filter((comment) => comment.parentCommentId === anchorCommentId)
    .sort((first, second) => Number(isUnseenByReader(second)) - Number(isUnseenByReader(first)) || second.baseScore - first.baseScore)
    .slice(0, limit)
    .map((comment) => comment.commentId);
}

function sanitizedReason(reason: string): string | null {
  const decoded = decodeStrayUnicodeEscapes(reason).trim();
  return decoded && decoded.length <= REASON_MAX_LENGTH ? decoded : null;
}

/**
 * The threads to show, with the comments to show from each. Picks the model
 * wasn't allowed to make (an unknown or notification-covered anchor, a second
 * anchor in the same thread, or anything past the comment budget) are dropped
 * rather than failing the issue.
 */
function selectedThreads(
  picks: Array<{ anchorCommentId: string; reason: string }>,
  cards: AiDigestThreadCard[],
): AiDigestSelectedThread[] {
  const threads: AiDigestSelectedThread[] = [];
  const shownThreadIds = new Set<string>();
  let remainingComments = MAX_SHOWN_COMMENTS;
  for (const { anchorCommentId, reason } of picks) {
    if (remainingComments === 0) {
      break;
    }
    const card = cards.find((candidate) => candidate.comments.some((comment) => comment.commentId === anchorCommentId));
    const anchor = card?.comments.find((comment) => comment.commentId === anchorCommentId);
    if (!card || !anchor || anchor.anchorIneligible || shownThreadIds.has(card.threadId)) {
      continue;
    }
    const commentsById = new Map(card.comments.map((comment) => [comment.commentId, comment]));
    const replies = replyIds(card, anchorCommentId, Math.min(MAX_REPLIES_PER_THREAD, remainingComments - 1));
    threads.push({
      anchorCommentId,
      commentIds: [...contextCommentIds(anchor, commentsById), anchorCommentId, ...replies],
      reason: sanitizedReason(reason),
    });
    shownThreadIds.add(card.threadId);
    remainingComments -= 1 + replies.length;
  }
  return threads;
}

export async function selectAiDigestThreads({ profile, cards, personalInstructions, asOf }: {
  profile: AiDigestReaderProfile;
  cards: AiDigestThreadCard[];
  personalInstructions: string | null;
  asOf: Date;
}): Promise<{ threads: AiDigestSelectedThread[]; call: AiDigestModelCallRecord }> {
  const { system, prompt } = buildAiDigestThreadSelectionPrompt({ profile, cards, personalInstructions, asOf });
  const result = await generateText({
    model: AI_DIGEST_MODEL_ID,
    system,
    messages: [aiDigestUserMessage(prompt)],
    providerOptions: aiDigestGatewayProviderOptions("thread-selection"),
    output: Output.object({
      schema: threadSelectionOutputSchema,
      name: "aiDigestThreadSelection",
      description: "Up to three comment threads for the LessWrong digest discussion section.",
    }),
    // The model deliberates in text before emitting the structured output, so
    // this needs headroom well beyond the size of the output object itself.
    maxOutputTokens: 10_000,
  });
  assertAiDigestModelFinished(result, "thread selection");
  return {
    threads: selectedThreads(result.output.selectedThreads, cards),
    call: aiDigestModelCallRecord({
      purpose: "thread-selection",
      modelId: AI_DIGEST_MODEL_ID,
      promptVersion: AI_DIGEST_THREAD_SELECTION_PROMPT_VERSION,
      system,
      prompt,
      result,
    }),
  };
}
