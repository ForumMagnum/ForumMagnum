import { generateText, Output, stepCountIs } from "ai";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import {
  type AiDigestQuickTakeCandidate,
  type AiDigestSelectedPostCandidate,
  buildAiDigestPostCandidateCards,
  isSelectableAiDigestCandidate,
  loadAiDigestPostCandidates,
  loadAiDigestQuickTakeCandidates,
  loadAiDigestReaderContext,
  loadAiDigestRecentlyCuratedPosts,
  relaxPreviousInclusionExclusions,
  type AiDigestPostCandidateCard,
  type AiDigestUserDossier,
  type LoadAiDigestPostCandidatesOptions,
} from "./aiDigestPostCandidates";
import type { AiDigestCuratedPostRow } from "@/server/repos/PostsRepo";
import {
  AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  ensureAiDigestPostSummaries,
} from "./aiDigestPostSummaries";
import {
  loadAiDigestHistory,
  persistAiDigestIssue,
  type AiDigestIssueTrigger,
  type AiDigestIssueInsert,
  type AiDigestSelectionTokenUsage,
} from "./aiDigestHistory";
import {
  AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
  buildAiDigestPostSelectionPrompt,
} from "./aiDigestPostSelectionPrompt";
import {
  buildAiDigestSelectionMessages,
  decodeStrayUnicodeEscapes,
  sumAiDigestSelectionCostUsd,
} from "./aiDigestSelectionShared";
import {
  AI_DIGEST_SELECTION_STEP_LIMIT,
  createAiDigestDiscoveredCandidateRegistry,
  createAiDigestSelectionTools,
  type AiDigestSelectionToolUsageCounts,
} from "./aiDigestSelectionTools";
import {
  loadAiDigestThreadCandidates,
  type AiDigestThreadCandidates,
} from "./aiDigestThreadCandidates";
import {
  runAiDigestThreadSelection,
  type AiDigestSelectedThread,
  type AiDigestThreadSelectionResult,
} from "./aiDigestThreadSelection";
import {
  type AiDigestItem,
  type AiDigestSection,
  type AiDigestSpec,
} from "@/server/emailComponents/AiDigestSpec";

export const AI_DIGEST_DEFAULT_SELECTION_MODEL_ID = "anthropic/claude-opus-5";
export const AI_DIGEST_MAX_QUICK_TAKES_PER_ISSUE = 2;
export const AI_DIGEST_CURATED_ITEM_LIMIT = 3;
/** Headline slots 1 and 2 are always posts, so a slate needs at least this many. */
export const AI_DIGEST_MIN_SELECTABLE_POST_CANDIDATES = 2;
export const AI_DIGEST_MIN_SELECTABLE_CANDIDATES = 5;

export const AI_DIGEST_SELECTION_LENGTH_LIMITS = {
  subject: 120,
  preheader: 180,
  aiNoteParagraph: 380,
  reason: 180,
};

const selectionOutputSchema = z.object({
  selectedItems: z.array(z.object({
    itemId: z.string(),
    reason: z.string().describe(
      "The true reason this item was chosen for this reader, e.g. \"Because you "
      + "follow author X\" or an honest inferred-interest match. Fall back to the "
      + "site-wide rationale (e.g. one of the most appreciated posts this week) only "
      + "when reader signals are too thin to ground any connection. Never describe "
      + "what the item is about, including in a clause appended after a dash or colon.",
    ),
  })).length(5),
  subject: z.string(),
  preheader: z.string(),
  aiNote: z.array(z.string()).min(1).max(3),
});

export type AiDigestPostSelectionModelOutput = z.infer<typeof selectionOutputSchema>;

export type AiDigestSelectedItemCandidate =
  | { documentType: "post"; candidate: AiDigestSelectedPostCandidate }
  | { documentType: "quickTake"; candidate: AiDigestQuickTakeCandidate };

export interface AiDigestPostSelectionOptions {
  selectionModelId?: string;
  selectionModelLabel?: string;
  summaryModelId?: string;
  candidateOptions?: LoadAiDigestPostCandidatesOptions;
  historyIssueLimit?: number;
  trigger?: AiDigestIssueTrigger;
  countsTowardHistory?: boolean;
  /**
   * When false, run selection/validation/assembly without writing an AiDigestIssues
   * row. Defaults to true for production digests.
   */
  persistIssue?: boolean;
}

export interface AiDigestPostSelectionResult {
  spec: AiDigestSpec;
  selectedCandidates: AiDigestSelectedItemCandidate[];
  issueId: string | null;
  generatedAt: Date;
  metadata: {
    selectionModelId: string;
    selectionModelLabel: string;
    selectionPromptVersion: string;
    summaryModelId: string;
    candidateCount: number;
    quickTakeCandidateCount: number;
    /** True when a thin candidate pool forced repeat exclusions to be dropped. */
    relaxedPreviousInclusions: boolean;
    evidenceCount: number;
    reusedSummaryCount: number;
    generatedSummaryCount: number;
    skippedPostCount: number;
    historyIssueCount: number;
    pastRecommendationCount: number;
    toolCallCount: number;
    searchCount: number;
    readPostCount: number;
    discoveredCandidateCount: number;
    inputTokenCount: number | null;
    outputTokenCount: number | null;
    uncachedInputTokenCount: number | null;
    cacheReadInputTokenCount: number | null;
    cacheWriteInputTokenCount: number | null;
    selectionCostUsd: number | null;
    threadCandidateCount: number;
    selectedThreadCount: number;
    threadInputTokenCount: number | null;
    threadOutputTokenCount: number | null;
    threadCacheReadInputTokenCount: number | null;
    threadSelectionCostUsd: number | null;
    generationDurationMs: number;
  };
}

export interface AiDigestPostSelectionFinalizationDependencies {
  persistIssue?: (issue: AiDigestIssueInsert) => Promise<string>;
}

export interface AiDigestPostSelectionFinalizationResult {
  output: AiDigestPostSelectionModelOutput;
  spec: AiDigestSpec;
  selectedCandidates: AiDigestSelectedItemCandidate[];
  issueId: string | null;
}

function assertLength(name: string, text: string, maximum: number): void {
  if (!text.trim() || text.length > maximum) {
    throw new Error(`${name} must contain 1-${maximum} characters`);
  }
}

export function sanitizeAiDigestPostSelectionOutput(
  output: AiDigestPostSelectionModelOutput,
): AiDigestPostSelectionModelOutput {
  return {
    selectedItems: output.selectedItems.map((selection) => ({
      itemId: selection.itemId,
      reason: decodeStrayUnicodeEscapes(selection.reason),
    })),
    subject: decodeStrayUnicodeEscapes(output.subject),
    preheader: decodeStrayUnicodeEscapes(output.preheader),
    aiNote: output.aiNote.map(decodeStrayUnicodeEscapes),
  };
}

function resolveSelectedItem(
  itemId: string,
  postsById: Map<string, AiDigestSelectedPostCandidate>,
  quickTakesById: Map<string, AiDigestQuickTakeCandidate>,
): AiDigestSelectedItemCandidate | null {
  const post = postsById.get(itemId);
  if (post) {
    return { documentType: "post", candidate: post };
  }
  const quickTake = quickTakesById.get(itemId);
  if (quickTake) {
    return { documentType: "quickTake", candidate: quickTake };
  }
  return null;
}

export function validateAiDigestPostSelectionOutput(
  output: AiDigestPostSelectionModelOutput,
  postCandidates: AiDigestSelectedPostCandidate[],
  quickTakeCandidates: AiDigestQuickTakeCandidate[] = [],
): AiDigestPostSelectionModelOutput {
  if (output.selectedItems.length !== 5) {
    throw new Error("Selection must contain exactly five items");
  }
  const postsById = new Map(
    postCandidates.map((candidate) => [candidate.postId, candidate]),
  );
  const quickTakesById = new Map(
    quickTakeCandidates.map((candidate) => [candidate.commentId, candidate]),
  );
  const selectedItemIds = output.selectedItems.map((selection) => selection.itemId);
  if (new Set(selectedItemIds).size !== 5) {
    throw new Error("Selection must contain five distinct items");
  }

  const resolved = selectedItemIds.map((itemId) => {
    const item = resolveSelectedItem(itemId, postsById, quickTakesById);
    if (!item) {
      throw new Error(`Selection referenced unknown item ID: ${itemId}`);
    }
    if (!isSelectableAiDigestCandidate(item.candidate)) {
      throw new Error(`Selection referenced an ineligible item ID: ${itemId}`);
    }
    return item;
  });

  if (resolved[0].documentType !== "post" || resolved[1].documentType !== "post") {
    throw new Error("Selection slots 1 and 2 must be posts");
  }
  const quickTakeCount = resolved.filter(
    (item) => item.documentType === "quickTake",
  ).length;
  if (quickTakeCount > AI_DIGEST_MAX_QUICK_TAKES_PER_ISSUE) {
    throw new Error(
      `Selection may include at most ${AI_DIGEST_MAX_QUICK_TAKES_PER_ISSUE} quick takes`,
    );
  }

  if (output.aiNote.length < 1 || output.aiNote.length > 3) {
    throw new Error("AI note must contain one to three paragraphs");
  }

  output.selectedItems.forEach((selection) => {
    assertLength(
      `Reason for ${selection.itemId}`,
      selection.reason,
      AI_DIGEST_SELECTION_LENGTH_LIMITS.reason,
    );
  });

  assertLength("Subject", output.subject, AI_DIGEST_SELECTION_LENGTH_LIMITS.subject);
  assertLength("Preheader", output.preheader, AI_DIGEST_SELECTION_LENGTH_LIMITS.preheader);
  output.aiNote.forEach((paragraph, index) => {
    assertLength(
      `AI note paragraph ${index + 1}`,
      paragraph,
      AI_DIGEST_SELECTION_LENGTH_LIMITS.aiNoteParagraph,
    );
  });
  return output;
}

function selectedItem(
  selection: AiDigestPostSelectionModelOutput["selectedItems"][number],
  resolved: AiDigestSelectedItemCandidate,
  index: number,
): AiDigestItem {
  if (resolved.documentType === "quickTake") {
    return {
      documentRef: {
        documentType: "quickTake",
        documentId: resolved.candidate.commentId,
      },
      placement: "full",
      reason: selection.reason,
    };
  }
  return {
    documentRef: {
      documentType: "post",
      documentId: resolved.candidate.postId,
    },
    placement: index < 2 ? "headline" : "compact",
    reason: selection.reason,
  };
}

/**
 * Quiet curated-module rows, drawn from the recent-curation lookback window
 * (excluding posts already selected as recommendations): always the module
 * limit's worth of posts when the window can supply them, unread ones first,
 * each group newest curation first. Read posts fill the remaining slots and
 * are greyed out in rendering.
 */
export function buildAiDigestCuratedItems(
  curatedPosts: AiDigestCuratedPostRow[],
  selectedItems: AiDigestItem[],
): AiDigestItem[] {
  const selectedPostIds = new Set(selectedItems.flatMap((item) =>
    item.documentRef.documentType === "post" ? [item.documentRef.documentId] : [],
  ));
  const eligiblePosts = curatedPosts.filter(
    (curatedPost) => !selectedPostIds.has(curatedPost.postId),
  );
  const shownPosts = [
    ...eligiblePosts.filter((curatedPost) => !curatedPost.isRead),
    ...eligiblePosts.filter((curatedPost) => curatedPost.isRead),
  ];
  return shownPosts
    .slice(0, AI_DIGEST_CURATED_ITEM_LIMIT)
    .map((curatedPost) => ({
      documentRef: {
        documentType: "post",
        documentId: curatedPost.postId,
      },
      placement: "quiet",
      isRead: curatedPost.isRead,
    }));
}

/**
 * Discussion-section items from the thread selection. Overlap with recommended
 * posts is allowed (a thread on a recommended post is complementary), but a
 * thread that contains a quick take already selected in the main five would be
 * literal duplication, so those threads are dropped here.
 */
export function buildAiDigestDiscussionItems(
  selectedThreads: AiDigestSelectedThread[],
  selectedItems: AiDigestItem[],
): AiDigestItem[] {
  const selectedQuickTakeIds = new Set(selectedItems.flatMap((item) =>
    item.documentRef.documentType === "quickTake" ? [item.documentRef.documentId] : [],
  ));
  return selectedThreads
    .filter((thread) =>
      !selectedQuickTakeIds.has(thread.anchorCommentId)
      && !thread.displayCommentIds.some((commentId) =>
        selectedQuickTakeIds.has(commentId)))
    .map((thread) => ({
      documentRef: {
        documentType: "comment",
        documentId: thread.anchorCommentId,
      },
      placement: "full",
      ...(thread.reason !== null ? { reason: thread.reason } : {}),
      threadComments: thread.displayCommentIds.map((commentId) => ({ commentId })),
    }));
}

export function buildAiDigestSpecFromPostSelection({
  recipientName,
  modelLabel,
  personalInstructions,
  output,
  postCandidates,
  quickTakeCandidates = [],
  curatedPosts = [],
  selectedThreads = [],
}: {
  recipientName: string;
  modelLabel: string;
  personalInstructions: string | null;
  output: AiDigestPostSelectionModelOutput;
  postCandidates: AiDigestSelectedPostCandidate[];
  quickTakeCandidates?: AiDigestQuickTakeCandidate[];
  curatedPosts?: AiDigestCuratedPostRow[];
  selectedThreads?: AiDigestSelectedThread[];
}): AiDigestSpec {
  const postsById = new Map(
    postCandidates.map((candidate) => [candidate.postId, candidate]),
  );
  const quickTakesById = new Map(
    quickTakeCandidates.map((candidate) => [candidate.commentId, candidate]),
  );
  const selectedItems = output.selectedItems.map((selection, index) => {
    const resolved = resolveSelectedItem(
      selection.itemId,
      postsById,
      quickTakesById,
    );
    if (!resolved) {
      throw new Error(`Cannot assemble unknown item ${selection.itemId}`);
    }
    return selectedItem(selection, resolved, index);
  });
  const discussionItems = buildAiDigestDiscussionItems(selectedThreads, selectedItems);
  const curatedItems = buildAiDigestCuratedItems(curatedPosts, selectedItems);
  const sections: AiDigestSection[] = [
    { kind: "recommendations", items: selectedItems },
    ...(discussionItems.length > 0
      ? [{
        kind: "discussion" as const,
        title: "From the discussion",
        items: discussionItems,
      }]
      : []),
    ...(curatedItems.length > 0
      ? [{
        kind: "curated" as const,
        title: "Recently curated",
        items: curatedItems,
      }]
      : []),
  ];

  return {
    recipientName,
    subject: output.subject,
    preheader: output.preheader,
    aiNote: {
      modelName: modelLabel,
      paragraphs: output.aiNote,
    },
    ...(personalInstructions !== null ? { personalInstructions } : {}),
    sections,
  };
}

function resolveSelectedCandidates(
  output: AiDigestPostSelectionModelOutput,
  postCandidates: AiDigestSelectedPostCandidate[],
  quickTakeCandidates: AiDigestQuickTakeCandidate[],
): AiDigestSelectedItemCandidate[] {
  const postsById = new Map(
    postCandidates.map((candidate) => [candidate.postId, candidate]),
  );
  const quickTakesById = new Map(
    quickTakeCandidates.map((candidate) => [candidate.commentId, candidate]),
  );
  return output.selectedItems.map((selection) => {
    const resolved = resolveSelectedItem(
      selection.itemId,
      postsById,
      quickTakesById,
    );
    if (!resolved) {
      throw new Error(`Cannot resolve selected item ${selection.itemId}`);
    }
    return resolved;
  });
}

/** The persisted slice of a completed thread-selection call. */
export interface AiDigestThreadSelectionFinalizationInput {
  selectedThreads: AiDigestSelectedThread[];
  threadPromptVersion: string;
  threadSelectionUserPrompt: string;
  threadInputTokenCount: number | null;
  threadOutputTokenCount: number | null;
  threadCacheReadInputTokenCount: number | null;
  threadSelectionCostUsd: number | null;
}

function aiDigestDiscussionCommentIdsFromSpec(spec: AiDigestSpec): string[] {
  return spec.sections
    .filter((section) => section.kind === "discussion")
    .flatMap((section) =>
      section.items.map((item) => item.documentRef.documentId));
}

export async function finalizeAiDigestPostSelection({
  recipientId,
  recipientName,
  modelLabel,
  selectionModelId,
  promptVersion,
  selectionSystemPrompt,
  selectionUserPrompt,
  tokenUsage,
  selectionCostUsd,
  generatedAt,
  generationDurationMs,
  trigger,
  countsTowardHistory,
  personalInstructions,
  output,
  postCandidates,
  quickTakeCandidates = [],
  curatedPosts = [],
  threadSelection = null,
  toolUsage = null,
  dependencies,
}: {
  recipientId: string;
  recipientName: string;
  modelLabel: string;
  selectionModelId: string;
  promptVersion: string;
  selectionSystemPrompt: string;
  selectionUserPrompt: string;
  tokenUsage: AiDigestSelectionTokenUsage;
  selectionCostUsd: number | null;
  generatedAt: Date;
  generationDurationMs: number;
  trigger: AiDigestIssueTrigger;
  countsTowardHistory: boolean;
  personalInstructions: string | null;
  output: AiDigestPostSelectionModelOutput;
  postCandidates: AiDigestSelectedPostCandidate[];
  quickTakeCandidates?: AiDigestQuickTakeCandidate[];
  curatedPosts?: AiDigestCuratedPostRow[];
  threadSelection?: AiDigestThreadSelectionFinalizationInput | null;
  toolUsage?: Pick<
    AiDigestSelectionToolUsageCounts,
    "toolCallCount" | "searchCount" | "readPostCount"
  > | null;
  dependencies: AiDigestPostSelectionFinalizationDependencies;
}): Promise<AiDigestPostSelectionFinalizationResult> {
  const validatedOutput = validateAiDigestPostSelectionOutput(
    sanitizeAiDigestPostSelectionOutput(output),
    postCandidates,
    quickTakeCandidates,
  );
  const spec = buildAiDigestSpecFromPostSelection({
    recipientName,
    modelLabel,
    personalInstructions,
    output: validatedOutput,
    postCandidates,
    quickTakeCandidates,
    curatedPosts,
    selectedThreads: threadSelection?.selectedThreads ?? [],
  });
  const selectedCandidates = resolveSelectedCandidates(
    validatedOutput,
    postCandidates,
    quickTakeCandidates,
  );
  const postIds = selectedCandidates.flatMap((item) =>
    item.documentType === "post" ? [item.candidate.postId] : [],
  );
  const quickTakeIds = selectedCandidates.flatMap((item) =>
    item.documentType === "quickTake" ? [item.candidate.commentId] : [],
  );
  const discussionCommentIds = aiDigestDiscussionCommentIdsFromSpec(spec);
  const issueId = dependencies.persistIssue
    ? await dependencies.persistIssue({
      recipientId,
      postIds,
      quickTakeIds,
      discussionCommentIds,
      generatedAt,
      generationDurationMs,
      trigger,
      countsTowardHistory,
      personalInstructions,
      selectionModelId,
      promptVersion,
      selectionSystemPrompt,
      selectionUserPrompt,
      ...tokenUsage,
      selectionCostUsd,
      toolCallCount: toolUsage?.toolCallCount ?? null,
      searchCount: toolUsage?.searchCount ?? null,
      readPostCount: toolUsage?.readPostCount ?? null,
      threadPromptVersion: threadSelection?.threadPromptVersion ?? null,
      threadSelectionUserPrompt: threadSelection?.threadSelectionUserPrompt ?? null,
      threadInputTokenCount: threadSelection?.threadInputTokenCount ?? null,
      threadOutputTokenCount: threadSelection?.threadOutputTokenCount ?? null,
      threadCacheReadInputTokenCount:
        threadSelection?.threadCacheReadInputTokenCount ?? null,
      threadSelectionCostUsd: threadSelection?.threadSelectionCostUsd ?? null,
      spec,
    })
    : null;
  return {
    output: validatedOutput,
    spec,
    selectedCandidates,
    issueId,
  };
}

export function humanizeAiDigestModelId(modelId: string): string {
  const modelName = modelId.split("/").at(-1) ?? modelId;
  return modelName
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

/**
 * The thread call is best-effort: when it fails, the issue is emitted without
 * a discussion section rather than failing outright (post selection remains
 * fail-fast).
 */
async function runAiDigestThreadSelectionSafely(options: {
  dossier: AiDigestUserDossier;
  threadCandidates: AiDigestThreadCandidates;
  personalInstructions: string | null;
  asOf: Date;
  modelId: string;
}): Promise<AiDigestThreadSelectionResult | null> {
  try {
    return await runAiDigestThreadSelection(options);
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error("AI digest thread selection failed; emitting issue without a discussion section", error);
    return null;
  }
}

function countAiDigestThreadCandidates(threadCandidates: AiDigestThreadCandidates): number {
  return threadCandidates.siteWideThreads.length + threadCandidates.readerThreads.length;
}

export interface AiDigestSelectionPools {
  candidateCards: AiDigestPostCandidateCard[];
  quickTakeCandidates: AiDigestQuickTakeCandidate[];
  selectableCandidateCards: AiDigestPostCandidateCard[];
  selectableQuickTakes: AiDigestQuickTakeCandidate[];
  relaxedPreviousInclusions: boolean;
}

function selectablePools(
  candidateCards: AiDigestPostCandidateCard[],
  quickTakeCandidates: AiDigestQuickTakeCandidate[],
  relaxedPreviousInclusions: boolean,
): AiDigestSelectionPools {
  return {
    candidateCards,
    quickTakeCandidates,
    selectableCandidateCards: candidateCards.filter(isSelectableAiDigestCandidate),
    selectableQuickTakes: quickTakeCandidates.filter(isSelectableAiDigestCandidate),
    relaxedPreviousInclusions,
  };
}

function poolIsTooThin(pools: AiDigestSelectionPools): boolean {
  return pools.selectableCandidateCards.length < AI_DIGEST_MIN_SELECTABLE_POST_CANDIDATES
    || pools.selectableCandidateCards.length + pools.selectableQuickTakes.length
      < AI_DIGEST_MIN_SELECTABLE_CANDIDATES;
}

/**
 * Previously recommended items are hard-excluded, which at a fast cadence can
 * leave too few candidates to fill a slate. When that happens, and only then,
 * the repeat exclusions are dropped so the issue can still be assembled.
 */
export function resolveAiDigestSelectionPools(
  candidateCards: AiDigestPostCandidateCard[],
  quickTakeCandidates: AiDigestQuickTakeCandidate[],
): AiDigestSelectionPools {
  const pools = selectablePools(candidateCards, quickTakeCandidates, false);
  const hasRepeatExclusions = [...candidateCards, ...quickTakeCandidates].some(
    (candidate) => candidate.exclusionReason === "previouslyIncluded",
  );
  if (!poolIsTooThin(pools) || !hasRepeatExclusions) {
    return pools;
  }
  return selectablePools(
    relaxPreviousInclusionExclusions(candidateCards),
    relaxPreviousInclusionExclusions(quickTakeCandidates),
    true,
  );
}

function assertAiDigestPoolIsSelectable(pools: AiDigestSelectionPools): void {
  const { selectableCandidateCards, selectableQuickTakes, candidateCards } = pools;
  if (selectableCandidateCards.length < AI_DIGEST_MIN_SELECTABLE_POST_CANDIDATES) {
    throw new Error(
      "AI digest needs at least two summarized, selectable post candidates for headline slots; "
      + `found ${selectableCandidateCards.length} of ${candidateCards.length}`,
    );
  }
  if (
    selectableCandidateCards.length + selectableQuickTakes.length
    < AI_DIGEST_MIN_SELECTABLE_CANDIDATES
  ) {
    throw new Error(
      "AI digest needs at least five summarized, selectable candidates; "
      + `found ${selectableCandidateCards.length} posts and ${selectableQuickTakes.length} quick takes`,
    );
  }
}

export async function generateAiDigestPostSelection({
  user,
  context,
  options = {},
}: {
  user: DbUser;
  context: ResolverContext;
  options?: AiDigestPostSelectionOptions;
}): Promise<AiDigestPostSelectionResult> {
  const generationStartedAt = Date.now();
  const selectionModelId = options.selectionModelId ?? AI_DIGEST_DEFAULT_SELECTION_MODEL_ID;
  const selectionModelLabel = options.selectionModelLabel
    ?? humanizeAiDigestModelId(selectionModelId);
  const summaryModelId = options.summaryModelId ?? AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID;
  const personalInstructions = user.aiDigestPersonalInstructions?.trim() || null;
  const asOf = options.candidateOptions?.now ?? new Date();
  const [readerContext, history] = await Promise.all([
    loadAiDigestReaderContext(user, context, asOf),
    loadAiDigestHistory({
      userId: user._id,
      context,
      issueLimit: options.historyIssueLimit,
    }),
  ]);
  const candidateOptions: LoadAiDigestPostCandidatesOptions = {
    ...options.candidateOptions,
    now: asOf,
    postHistoryById: history.postHistoryById,
  };
  const [candidates, quickTakeCandidates, curatedPosts, threadCandidates] = await Promise.all([
    loadAiDigestPostCandidates(user, context, candidateOptions),
    loadAiDigestQuickTakeCandidates(user, context, candidateOptions),
    loadAiDigestRecentlyCuratedPosts(user, context, asOf),
    loadAiDigestThreadCandidates(user, context, {
      maxAgeDays: options.candidateOptions?.maxAgeDays,
      now: asOf,
      postHistoryById: history.postHistoryById,
    }),
  ]);
  const summaryResult = await ensureAiDigestPostSummaries({
    candidates,
    context,
    modelId: summaryModelId,
  });
  const pools = resolveAiDigestSelectionPools(
    buildAiDigestPostCandidateCards(summaryResult.candidates),
    quickTakeCandidates,
  );
  assertAiDigestPoolIsSelectable(pools);
  const { candidateCards, selectableCandidateCards, selectableQuickTakes } = pools;
  const prompt = buildAiDigestPostSelectionPrompt(
    readerContext.dossier,
    candidateCards,
    history.pastRecommendations,
    personalInstructions,
    asOf,
    pools.quickTakeCandidates,
  );
  const discoveredRegistry = createAiDigestDiscoveredCandidateRegistry();
  const { tools, getUsageCounts } = createAiDigestSelectionTools({
    toolsContext: {
      user,
      context,
      corpusPostIds: new Set(candidateCards.map((candidate) => candidate.postId)),
      postHistoryById: history.postHistoryById,
      now: asOf,
      minKarma: options.candidateOptions?.minKarma,
    },
    registry: discoveredRegistry,
  });
  const [result, threadSelection] = await Promise.all([
    generateText({
      model: selectionModelId,
      system: prompt.system,
      messages: buildAiDigestSelectionMessages({
        sharedPrefix: prompt.sharedPrefix,
        personalizedSuffix: prompt.personalizedSuffix,
        enableAnthropicCaching: selectionModelId.startsWith("anthropic/"),
      }),
      tools,
      stopWhen: stepCountIs(AI_DIGEST_SELECTION_STEP_LIMIT),
      output: Output.object({
        schema: selectionOutputSchema,
        name: "aiDigestPostSelection",
        description: "A ranked five-item LessWrong digest selection of posts and optional quick takes.",
      }),
      maxOutputTokens: 12_000,
    }),
    runAiDigestThreadSelectionSafely({
      dossier: readerContext.dossier,
      threadCandidates,
      personalInstructions,
      asOf,
      modelId: selectionModelId,
    }),
  ]);
  if (result.finishReason !== "stop") {
    throw new Error(
      `AI digest selection stopped with finish reason ${result.finishReason} after `
      + `${result.totalUsage.outputTokens ?? 0} output tokens`,
    );
  }
  const toolUsage = getUsageCounts();
  const tokenUsage: AiDigestSelectionTokenUsage = {
    inputTokenCount: result.totalUsage.inputTokens ?? null,
    outputTokenCount: result.totalUsage.outputTokens ?? null,
    uncachedInputTokenCount: result.totalUsage.inputTokenDetails.noCacheTokens ?? null,
    cacheReadInputTokenCount: result.totalUsage.inputTokenDetails.cacheReadTokens ?? null,
    cacheWriteInputTokenCount: result.totalUsage.inputTokenDetails.cacheWriteTokens ?? null,
  };
  const selectionCostUsd = sumAiDigestSelectionCostUsd(
    result.steps.map((step) => step.providerMetadata),
  );
  const generationDurationMs = Date.now() - generationStartedAt;
  const generatedAt = new Date();
  const shouldPersistIssue = options.persistIssue !== false;
  const validationPostCandidates: AiDigestSelectedPostCandidate[] = [
    ...selectableCandidateCards,
    ...Array.from(discoveredRegistry.byPostId.values()),
  ];
  const threadSelectionInput: AiDigestThreadSelectionFinalizationInput | null =
    threadSelection
      ? {
        selectedThreads: threadSelection.output.selectedThreads,
        threadPromptVersion: threadSelection.promptVersion,
        threadSelectionUserPrompt: threadSelection.prompt.prompt,
        ...threadSelection.tokenUsage,
        threadSelectionCostUsd: threadSelection.threadSelectionCostUsd,
      }
      : null;
  const finalized = await finalizeAiDigestPostSelection({
    recipientId: user._id,
    recipientName: user.displayName,
    modelLabel: selectionModelLabel,
    selectionModelId,
    promptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
    selectionSystemPrompt: prompt.system,
    selectionUserPrompt: prompt.prompt,
    tokenUsage,
    selectionCostUsd,
    generatedAt,
    generationDurationMs,
    trigger: options.trigger ?? "adminSample",
    countsTowardHistory: options.countsTowardHistory ?? true,
    personalInstructions,
    output: result.output,
    postCandidates: validationPostCandidates,
    quickTakeCandidates: selectableQuickTakes,
    curatedPosts,
    threadSelection: threadSelectionInput,
    toolUsage,
    dependencies: shouldPersistIssue
      ? { persistIssue: persistAiDigestIssue }
      : {},
  });

  return {
    spec: finalized.spec,
    selectedCandidates: finalized.selectedCandidates,
    issueId: finalized.issueId,
    generatedAt,
    metadata: {
      selectionModelId,
      selectionModelLabel,
      selectionPromptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
      summaryModelId,
      candidateCount: candidateCards.length,
      quickTakeCandidateCount: pools.quickTakeCandidates.length,
      relaxedPreviousInclusions: pools.relaxedPreviousInclusions,
      evidenceCount: readerContext.evidenceCount,
      reusedSummaryCount: summaryResult.reusedSummaryCount,
      generatedSummaryCount: summaryResult.generatedSummaryCount,
      skippedPostCount: summaryResult.skippedPostCount,
      historyIssueCount: history.issues.length,
      pastRecommendationCount: history.pastRecommendations.length,
      ...toolUsage,
      ...tokenUsage,
      selectionCostUsd,
      threadCandidateCount: countAiDigestThreadCandidates(threadCandidates),
      selectedThreadCount: aiDigestDiscussionCommentIdsFromSpec(finalized.spec).length,
      threadInputTokenCount: threadSelection?.tokenUsage.threadInputTokenCount ?? null,
      threadOutputTokenCount: threadSelection?.tokenUsage.threadOutputTokenCount ?? null,
      threadCacheReadInputTokenCount:
        threadSelection?.tokenUsage.threadCacheReadInputTokenCount ?? null,
      threadSelectionCostUsd: threadSelection?.threadSelectionCostUsd ?? null,
      generationDurationMs,
    },
  };
}
