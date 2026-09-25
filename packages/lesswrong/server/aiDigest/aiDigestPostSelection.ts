import { loadReaderSubscribedAuthorIds } from "./aiDigestReaderSignals";
import { generateText, Output, stepCountIs } from "ai";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import {
  AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS,
  AI_DIGEST_DEFAULT_MIN_KARMA,
  type AiDigestQuickTakeCandidate,
  type AiDigestSelectedPostCandidate,
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
import type { AiDigestCuratedPostRow } from "./aiDigestPostLookups";
import {
  AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  ensureAiDigestPostSummaries,
} from "./aiDigestPostSummaries";
import {
  AI_DIGEST_DEFAULT_PREVIEW_MODEL_ID,
  ensureAiDigestPostPreviews,
} from "./aiDigestPostPreviews";
import {
  loadAiDigestHistory,
  persistAiDigestIssue,
  type AiDigestIssueTrigger,
  type AiDigestSelectionTokenUsage,
} from "./aiDigestHistory";
import {
  AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
  buildAiDigestPostSelectionPrompt,
} from "./aiDigestPostSelectionPrompt";
import {
  aiDigestGatewayProviderOptions,
  buildAiDigestSelectionMessages,
  decodeStrayUnicodeEscapes,
  sumAiDigestSelectionCostUsd,
} from "./aiDigestSelectionShared";
import {
  AI_DIGEST_SELECTION_STEP_LIMIT,
  createAiDigestDiscoveredCandidateRegistry,
  createAiDigestSelectionTools,
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
import type {
  AiDigestItem,
  AiDigestSection,
  AiDigestSpec,
} from "@/lib/aiDigest/aiDigestSpec";

const AI_DIGEST_DEFAULT_SELECTION_MODEL_ID = "anthropic/claude-fable-5.1";
const AI_DIGEST_MAX_QUICK_TAKES_PER_ISSUE = 2;
const AI_DIGEST_CURATED_ITEM_LIMIT = 3;
/** Headline slots 1 and 2 are always posts, so a slate needs at least this many. */
const AI_DIGEST_MIN_SELECTABLE_POST_CANDIDATES = 2;
const AI_DIGEST_MIN_SELECTABLE_CANDIDATES = 5;

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

type AiDigestSelectedItemCandidate =
  | { documentType: "post"; candidate: AiDigestSelectedPostCandidate }
  | { documentType: "quickTake"; candidate: AiDigestQuickTakeCandidate };

interface AiDigestValidatedSelection extends Omit<AiDigestPostSelectionModelOutput, "selectedItems"> {
  selectedItems: (AiDigestSelectedItemCandidate & { reason: string })[];
}

interface AiDigestPostSelectionOptions {
  trigger?: AiDigestIssueTrigger;
  countsTowardHistory?: boolean;
}

interface AiDigestPostSelectionResult {
  spec: AiDigestSpec;
  issueId: string;
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
): AiDigestValidatedSelection {
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

  const resolved = output.selectedItems.map(({ itemId, reason }) => {
    const item = resolveSelectedItem(itemId, postsById, quickTakesById);
    if (!item) {
      throw new Error(`Selection referenced unknown item ID: ${itemId}`);
    }
    if (!isSelectableAiDigestCandidate(item.candidate)) {
      throw new Error(`Selection referenced an ineligible item ID: ${itemId}`);
    }
    return { ...item, reason };
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
  return { ...output, selectedItems: resolved };
}

function selectedItem(
  resolved: AiDigestValidatedSelection["selectedItems"][number],
  index: number,
  previewHtmlByPostId: Map<string, string>,
): AiDigestItem {
  if (resolved.documentType === "quickTake") {
    return {
      documentRef: {
        documentType: "quickTake",
        documentId: resolved.candidate.commentId,
      },
      placement: "full",
      reason: resolved.reason,
    };
  }
  const previewHtml = previewHtmlByPostId.get(resolved.candidate.postId);
  return {
    documentRef: {
      documentType: "post",
      documentId: resolved.candidate.postId,
    },
    placement: index < 2 ? "headline" : "compact",
    reason: resolved.reason,
    ...(previewHtml ? { previewHtml } : {}),
  };
}

/**
 * Quiet curated-module rows, drawn from the recent-curation lookback window
 * (excluding posts already selected as recommendations): always the module
 * limit's worth of posts when the window can supply them, unread ones first,
 * each group newest curation first. Read posts fill the remaining slots and
 * are greyed out in rendering.
 */
function buildAiDigestCuratedItems(
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
    .map((thread): AiDigestItem => {
      const contextOverlapsQuickTake = thread.contextCommentIds.some(
        (commentId) => selectedQuickTakeIds.has(commentId),
      );
      const contextComments = contextOverlapsQuickTake
        ? []
        : thread.contextCommentIds.map((commentId) => ({ commentId }));
      return {
        documentRef: {
          documentType: "comment",
          documentId: thread.anchorCommentId,
        },
        placement: "full",
        ...(thread.reason !== null ? { reason: thread.reason } : {}),
        ...(contextComments.length > 0 ? { contextComments } : {}),
        threadComments: thread.displayCommentIds.map((commentId) => ({ commentId })),
      };
    });
}

export function buildAiDigestSpecFromPostSelection({
  recipientName,
  modelLabel,
  personalInstructions,
  output,
  curatedPosts = [],
  selectedThreads = [],
  previewHtmlByPostId = new Map(),
}: {
  recipientName: string;
  modelLabel: string;
  personalInstructions: string | null;
  output: AiDigestValidatedSelection;
  curatedPosts?: AiDigestCuratedPostRow[];
  selectedThreads?: AiDigestSelectedThread[];
  previewHtmlByPostId?: Map<string, string>;
}): AiDigestSpec {
  const selectedItems = output.selectedItems.map((selection, index) =>
    selectedItem(selection, index, previewHtmlByPostId));
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

function aiDigestDiscussionCommentIdsFromSpec(spec: AiDigestSpec): string[] {
  return spec.sections
    .filter((section) => section.kind === "discussion")
    .flatMap((section) =>
      section.items.map((item) => item.documentRef.documentId));
}

function humanizeAiDigestModelId(modelId: string): string {
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

interface AiDigestSelectionPools {
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
  const selectionModelId = AI_DIGEST_DEFAULT_SELECTION_MODEL_ID;
  const selectionModelLabel = humanizeAiDigestModelId(selectionModelId);
  const summaryModelId = AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID;
  const previewModelId = AI_DIGEST_DEFAULT_PREVIEW_MODEL_ID;
  const personalInstructions = user.aiDigestPersonalInstructions?.trim() || null;
  const asOf = new Date();
  const [subscribedAuthorIds, history] = await Promise.all([
    loadReaderSubscribedAuthorIds(user._id),
    loadAiDigestHistory(user._id),
  ]);
  const candidateOptions: LoadAiDigestPostCandidatesOptions = {
    subscribedAuthorIds,
    now: asOf,
    postHistoryById: history.postHistoryById,
  };
  const [readerContext, candidates, quickTakeCandidates, curatedPosts, threadCandidates] = await Promise.all([
    loadAiDigestReaderContext(user, context, subscribedAuthorIds, asOf),
    loadAiDigestPostCandidates(user, context, candidateOptions),
    loadAiDigestQuickTakeCandidates(user, context, candidateOptions),
    loadAiDigestRecentlyCuratedPosts(user, context, asOf),
    loadAiDigestThreadCandidates(user, context, {
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
    summaryResult.candidates,
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
    { retrievalWindowDays: AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS, minimumKarma: AI_DIGEST_DEFAULT_MIN_KARMA },
  );
  const discoveredRegistry = createAiDigestDiscoveredCandidateRegistry();
  const { tools, getUsageCounts } = createAiDigestSelectionTools({
    toolsContext: {
      user,
      context,
      subscribedAuthorIds,
      corpusPostIds: new Set(candidateCards.map((candidate) => candidate.postId)),
      postHistoryById: history.postHistoryById,
      now: asOf,
      allowPreviousInclusions: pools.relaxedPreviousInclusions,
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
      providerOptions: aiDigestGatewayProviderOptions("post-selection"),
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
  const validationPostCandidates: AiDigestSelectedPostCandidate[] = [
    ...selectableCandidateCards,
    ...Array.from(discoveredRegistry.byPostId.values()),
  ];
  const validatedOutput = validateAiDigestPostSelectionOutput(
    sanitizeAiDigestPostSelectionOutput(result.output),
    validationPostCandidates,
    selectableQuickTakes,
  );
  const selectedCandidates = validatedOutput.selectedItems;
  const selectedPosts = selectedCandidates.flatMap((item) =>
    item.documentType === "post" ? [item.candidate] : [],
  );
  // Only generate previews for the handful of posts that made the slate.
  const { previewHtmlByPostId } = await ensureAiDigestPostPreviews({
    targets: selectedPosts,
    context,
    modelId: previewModelId,
  });
  const spec = buildAiDigestSpecFromPostSelection({
    recipientName: user.displayName,
    modelLabel: selectionModelLabel,
    personalInstructions,
    output: validatedOutput,
    curatedPosts,
    selectedThreads: threadSelection?.output.selectedThreads ?? [],
    previewHtmlByPostId,
  });
  const discussionCommentIds = aiDigestDiscussionCommentIdsFromSpec(spec);
  const issueId = await persistAiDigestIssue({
    recipientId: user._id,
    postIds: selectedPosts.map((candidate) => candidate.postId),
    quickTakeIds: selectedCandidates.flatMap((item) =>
      item.documentType === "quickTake" ? [item.candidate.commentId] : [],
    ),
    discussionCommentIds,
    generatedAt,
    generationDurationMs,
    trigger: options.trigger ?? "adminSample",
    countsTowardHistory: options.countsTowardHistory ?? true,
    personalInstructions,
    selectionModelId,
    promptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
    selectionSystemPrompt: prompt.system,
    selectionUserPrompt: prompt.prompt,
    ...tokenUsage,
    selectionCostUsd,
    spec,
  });

  // Diagnostics belong in analytics; issue rows retain fields consumed by the
  // reader experience and admin workbench.
  serverCaptureEvent("aiDigestGenerated", {
    userId: user._id,
    issueId,
    generatedAt: generatedAt.toISOString(),
    trigger: options.trigger ?? "adminSample",
    countsTowardHistory: options.countsTowardHistory ?? true,
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
    threadPromptVersion: threadSelection?.promptVersion ?? null,
    threadSelectionUserPrompt: threadSelection?.prompt.prompt ?? null,
    threadCandidateCount: countAiDigestThreadCandidates(threadCandidates),
    selectedThreadCount: discussionCommentIds.length,
    threadInputTokenCount: threadSelection?.tokenUsage.threadInputTokenCount ?? null,
    threadOutputTokenCount: threadSelection?.tokenUsage.threadOutputTokenCount ?? null,
    threadCacheReadInputTokenCount:
      threadSelection?.tokenUsage.threadCacheReadInputTokenCount ?? null,
    threadSelectionCostUsd: threadSelection?.threadSelectionCostUsd ?? null,
    generationDurationMs,
  });

  return { spec, issueId };
}
