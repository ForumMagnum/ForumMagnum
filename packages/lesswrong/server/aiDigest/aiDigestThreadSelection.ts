import { generateText, Output } from "ai";
import { z } from "zod";
import type { AiDigestUserDossier } from "./aiDigestPostCandidates";
import {
  buildAiDigestSelectionMessages,
  decodeStrayUnicodeEscapes,
  sumAiDigestSelectionCostUsd,
} from "./aiDigestSelectionShared";
import type {
  AiDigestThreadAnnotation,
  AiDigestThreadCandidates,
  AiDigestThreadCard,
} from "./aiDigestThreadCandidates";
import {
  AI_DIGEST_THREAD_SELECTION_PROMPT_VERSION,
  buildAiDigestThreadSelectionPrompt,
  type AiDigestThreadSelectionPrompt,
} from "./aiDigestThreadSelectionPrompt";

export const AI_DIGEST_MAX_THREADS_PER_ISSUE = 3;
/** Displayed comments per thread, anchor included. */
export const AI_DIGEST_MAX_COMMENTS_PER_THREAD = 3;
/** Displayed comments across all threads, anchors included. */
export const AI_DIGEST_MAX_THREAD_COMMENTS_TOTAL = 6;
export const AI_DIGEST_THREAD_REASON_MAX_LENGTH = 180;

const threadSelectionOutputSchema = z.object({
  selectedThreads: z.array(z.object({
    anchorCommentId: z.string(),
    displayCommentIds: z.array(z.string()).describe(
      "Additional comment IDs to display beneath the anchor, at most two, "
      + "not repeating the anchor. Each one's parent chain must reach the "
      + "anchor within the displayed set.",
    ),
    reason: z.string().describe(
      "The true reason this thread was selected for this reader, e.g. \"New "
      + "replies in a thread you commented in\" or an honest inferred-interest "
      + "match. Fall back to the site-wide rationale (e.g. one of the most "
      + "upvoted discussions this week) only when reader signals are too thin "
      + "to ground any connection. Never a synopsis of the thread's contents.",
    ),
  })).max(AI_DIGEST_MAX_THREADS_PER_ISSUE),
});

export type AiDigestThreadSelectionModelOutput = z.infer<typeof threadSelectionOutputSchema>;

export interface AiDigestSelectedThread {
  anchorCommentId: string;
  displayCommentIds: string[];
  /** Null only when clamping dropped an empty or overlong model reason. */
  reason: string | null;
}

export interface AiDigestClampedThreadSelection {
  selectedThreads: AiDigestSelectedThread[];
}

interface ThreadCommentLookupEntry {
  threadId: string;
  parentCommentId: string | null;
}

function allThreadCards(candidates: AiDigestThreadCandidates): AiDigestThreadCard[] {
  return [...candidates.siteWideThreads, ...candidates.readerThreads];
}

function buildCommentLookup(
  candidates: AiDigestThreadCandidates,
): Map<string, ThreadCommentLookupEntry> {
  return new Map(
    allThreadCards(candidates).flatMap((card) =>
      card.comments.map((comment): [string, ThreadCommentLookupEntry] => [
        comment.commentId,
        { threadId: card.threadId, parentCommentId: comment.parentCommentId },
      ]),
    ),
  );
}

/**
 * Site-wide thread cards are a byte-stable shared prompt prefix, so previously
 * recommended threads cannot be dropped from the corpus per-reader. Instead, a
 * repeated thread earns a second showing only when the discussion actually
 * moved: at least one card comment published after the last time it ran.
 */
export function threadRepeatHasNewActivity(
  card: AiDigestThreadCard | undefined,
  annotation: AiDigestThreadAnnotation | undefined,
): boolean {
  if (!annotation || annotation.previousDigestInclusionCount === 0) {
    return true;
  }
  const { lastIncludedAt } = annotation;
  if (!lastIncludedAt) {
    return true;
  }
  return !!card?.comments.some(
    (comment) => comment.publicationDate > lastIncludedAt,
  );
}

function sanitizedReason(reason: string): string | null {
  const decoded = decodeStrayUnicodeEscapes(reason).trim();
  if (!decoded || decoded.length > AI_DIGEST_THREAD_REASON_MAX_LENGTH) {
    return null;
  }
  return decoded;
}

/**
 * Displayed comments kept in order, restricted to those whose parent chain
 * reaches the anchor within the displayed set (fixpoint over the kept set, so
 * chains through other displayed comments resolve regardless of list order).
 */
function connectedDisplayComments(
  anchorCommentId: string,
  displayCommentIds: string[],
  commentsById: Map<string, ThreadCommentLookupEntry>,
  threadId: string,
): string[] {
  const candidateIds = displayCommentIds.filter((commentId, index) =>
    commentId !== anchorCommentId
    && displayCommentIds.indexOf(commentId) === index
    && commentsById.get(commentId)?.threadId === threadId,
  );
  const kept = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    candidateIds.forEach((commentId) => {
      if (kept.has(commentId)) {
        return;
      }
      const parentId = commentsById.get(commentId)?.parentCommentId;
      if (parentId === anchorCommentId || (parentId && kept.has(parentId))) {
        kept.add(commentId);
        changed = true;
      }
    });
  }
  return candidateIds
    .filter((commentId) => kept.has(commentId))
    .slice(0, AI_DIGEST_MAX_COMMENTS_PER_THREAD - 1);
}

/**
 * Deterministic clamping of the thread-selection model output: unknown IDs,
 * ineligible anchors, excluded threads, stale repeats, disconnected display
 * comments, duplicate threads, overlong reasons, and the thread/comment count
 * limits are all resolved by dropping or trimming — never by failing the issue.
 */
export function clampAiDigestThreadSelectionOutput(
  output: AiDigestThreadSelectionModelOutput,
  candidates: AiDigestThreadCandidates,
): AiDigestClampedThreadSelection {
  const commentsById = buildCommentLookup(candidates);
  const cardsByThreadId = new Map(
    allThreadCards(candidates).map((card) => [card.threadId, card]),
  );
  const usedThreadIds = new Set<string>();
  let totalDisplayedComments = 0;

  const selectedThreads = output.selectedThreads.flatMap((selection) => {
    if (usedThreadIds.size >= AI_DIGEST_MAX_THREADS_PER_ISSUE) {
      return [];
    }
    const anchor = commentsById.get(selection.anchorCommentId);
    if (!anchor || usedThreadIds.has(anchor.threadId)) {
      return [];
    }
    const anchorFlags = candidates.commentFlagsById.get(selection.anchorCommentId);
    if (anchorFlags?.anchorIneligibilityReason) {
      return [];
    }
    const threadAnnotation = candidates.threadAnnotationsById.get(anchor.threadId);
    if (threadAnnotation?.hasActiveSeeLess) {
      return [];
    }
    if (!threadRepeatHasNewActivity(
      cardsByThreadId.get(anchor.threadId),
      threadAnnotation,
    )) {
      return [];
    }
    const remainingBudget = AI_DIGEST_MAX_THREAD_COMMENTS_TOTAL - totalDisplayedComments;
    if (remainingBudget < 1) {
      return [];
    }
    const displayCommentIds = connectedDisplayComments(
      selection.anchorCommentId,
      selection.displayCommentIds,
      commentsById,
      anchor.threadId,
    ).slice(0, remainingBudget - 1);
    usedThreadIds.add(anchor.threadId);
    totalDisplayedComments += 1 + displayCommentIds.length;
    return [{
      anchorCommentId: selection.anchorCommentId,
      displayCommentIds,
      reason: sanitizedReason(selection.reason),
    }];
  });
  return { selectedThreads };
}

export interface AiDigestThreadSelectionTokenUsage {
  threadInputTokenCount: number | null;
  threadOutputTokenCount: number | null;
  threadCacheReadInputTokenCount: number | null;
}

export interface AiDigestThreadSelectionResult {
  output: AiDigestClampedThreadSelection;
  prompt: AiDigestThreadSelectionPrompt;
  promptVersion: string;
  tokenUsage: AiDigestThreadSelectionTokenUsage;
  threadSelectionCostUsd: number | null;
}

/**
 * The thread-selection model call: toolless, single-step, structured output,
 * with the same shared-prefix/personalized-suffix cache split as the post
 * call. The returned output is already deterministically clamped.
 */
export async function runAiDigestThreadSelection({
  dossier,
  threadCandidates,
  personalInstructions,
  asOf,
  modelId,
}: {
  dossier: AiDigestUserDossier;
  threadCandidates: AiDigestThreadCandidates;
  personalInstructions: string | null;
  asOf: Date;
  modelId: string;
}): Promise<AiDigestThreadSelectionResult> {
  const prompt = buildAiDigestThreadSelectionPrompt(
    dossier,
    threadCandidates,
    personalInstructions,
    asOf,
  );
  const result = await generateText({
    model: modelId,
    system: prompt.system,
    messages: buildAiDigestSelectionMessages({
      sharedPrefix: prompt.sharedPrefix,
      personalizedSuffix: prompt.personalizedSuffix,
      enableAnthropicCaching: modelId.startsWith("anthropic/"),
    }),
    output: Output.object({
      schema: threadSelectionOutputSchema,
      name: "aiDigestThreadSelection",
      description:
        "Up to three comment-thread selections for the LessWrong digest discussion section.",
    }),
    // The model deliberates in text before emitting the structured output, so
    // this needs headroom well beyond the size of the output object itself.
    maxOutputTokens: 10_000,
  });
  if (result.finishReason !== "stop") {
    throw new Error(
      `AI digest thread selection stopped with finish reason ${result.finishReason} after `
      + `${result.totalUsage.outputTokens ?? 0} output tokens`,
    );
  }
  return {
    output: clampAiDigestThreadSelectionOutput(result.output, threadCandidates),
    prompt,
    promptVersion: AI_DIGEST_THREAD_SELECTION_PROMPT_VERSION,
    tokenUsage: {
      threadInputTokenCount: result.totalUsage.inputTokens ?? null,
      threadOutputTokenCount: result.totalUsage.outputTokens ?? null,
      threadCacheReadInputTokenCount:
        result.totalUsage.inputTokenDetails.cacheReadTokens ?? null,
    },
    threadSelectionCostUsd: sumAiDigestSelectionCostUsd(
      result.steps.map((step) => step.providerMetadata),
    ),
  };
}
