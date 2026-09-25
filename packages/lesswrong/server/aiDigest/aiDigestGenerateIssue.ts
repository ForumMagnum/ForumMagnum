import { captureException } from "@/lib/sentryWrapper";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import type { AiDigestRecentlyCuratedPostRow } from "@/server/repos/PostsRepo";
import {
  aiDigestCandidatePool,
  loadAiDigestQuickTakeCandidates,
  loadRecentAiDigestPostCandidates,
} from "./aiDigestCandidates";
import { loadAiDigestHistory, persistAiDigestIssue, type AiDigestIssueTrigger } from "./aiDigestHistory";
import { ensureAiDigestPostPreviews } from "./aiDigestPostPreviews";
import { AI_DIGEST_SELECTION_MODEL_ID, selectAiDigestPosts, type AiDigestPostSelection } from "./aiDigestPostSelection";
import { ensureAiDigestPostSummaries } from "./aiDigestPostSummaries";
import { loadAiDigestReaderProfile, type AiDigestReaderProfile } from "./aiDigestReaderProfile";
import { loadAiDigestThreadCards, type AiDigestThreadCard } from "./aiDigestThreadCandidates";
import { selectAiDigestThreads, type AiDigestSelectedThread } from "./aiDigestThreadSelection";

const CURATED_LOOKBACK_COUNT = 10;
const CURATED_ITEM_LIMIT = 3;

/** e.g. "anthropic/claude-fable-5.1" -> "Claude Fable 5.1" */
function humanizeModelId(modelId: string): string {
  const modelName = modelId.split("/").at(-1) ?? modelId;
  return modelName
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

/**
 * The discussion section is best-effort: if thread selection fails, the issue
 * goes out without one rather than not at all.
 */
async function selectThreadsOrNone(options: {
  profile: AiDigestReaderProfile;
  cards: AiDigestThreadCard[];
  personalInstructions: string | null;
  asOf: Date;
}) {
  if (options.cards.length === 0) {
    return null;
  }
  try {
    return await selectAiDigestThreads({ ...options, modelId: AI_DIGEST_SELECTION_MODEL_ID });
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error("AI digest thread selection failed; emitting issue without a discussion section", error);
    return null;
  }
}

function recommendationItems(selection: AiDigestPostSelection, previewHtmlByPostId: Map<string, string>): AiDigestItem[] {
  return selection.items.map((item, index): AiDigestItem => item.documentType === "quickTake"
    ? {
      documentRef: { documentType: "quickTake", documentId: item.quickTake.commentId },
      placement: "full",
      reason: item.reason,
    }
    : {
      documentRef: { documentType: "post", documentId: item.post.postId },
      placement: index < 2 ? "headline" : "compact",
      reason: item.reason,
      previewHtml: previewHtmlByPostId.get(item.post.postId),
    });
}

/**
 * Threads are shown alongside the recommendations even when they're on a
 * recommended post, but not when they would show a recommended quick take a
 * second time. A recommended quick take above the anchor is dropped from the
 * thread's context instead.
 */
function discussionItems(threads: AiDigestSelectedThread[], recommendations: AiDigestItem[]): AiDigestItem[] {
  const recommendedQuickTakeIds = new Set(recommendations.flatMap(({ documentRef }) =>
    documentRef.documentType === "quickTake" ? [documentRef.documentId] : []));
  return threads.flatMap(({ anchorCommentId, commentIds, reason }): AiDigestItem[] => {
    const anchorIndex = commentIds.indexOf(anchorCommentId);
    const anchorAndReplies = commentIds.slice(anchorIndex);
    if (anchorAndReplies.some((commentId) => recommendedQuickTakeIds.has(commentId))) {
      return [];
    }
    const contextOverlaps = commentIds.slice(0, anchorIndex).some((commentId) => recommendedQuickTakeIds.has(commentId));
    return [{
      documentRef: { documentType: "comment", documentId: anchorCommentId },
      placement: "full",
      reason: reason ?? undefined,
      commentIds: contextOverlaps ? anchorAndReplies : commentIds,
    }];
  });
}

/**
 * The curated module: the most recently curated posts that weren't already
 * recommended, unread ones first. Read ones fill any remaining slots and are
 * greyed out.
 */
function curatedItems(curatedPosts: AiDigestRecentlyCuratedPostRow[], recommendations: AiDigestItem[]): AiDigestItem[] {
  const recommendedIds = new Set(recommendations.map(({ documentRef }) => documentRef.documentId));
  const eligiblePosts = curatedPosts.filter(({ postId }) => !recommendedIds.has(postId));
  return [...eligiblePosts.filter(({ isRead }) => !isRead), ...eligiblePosts.filter(({ isRead }) => isRead)]
    .slice(0, CURATED_ITEM_LIMIT)
    .map(({ postId, isRead }) => ({
      documentRef: { documentType: "post", documentId: postId },
      placement: "quiet",
      isRead,
    }));
}

function buildAiDigestSpec({ user, personalInstructions, postSelection, threads, curatedPosts, previewHtmlByPostId }: {
  user: DbUser;
  personalInstructions: string | null;
  postSelection: AiDigestPostSelection;
  threads: AiDigestSelectedThread[];
  curatedPosts: AiDigestRecentlyCuratedPostRow[];
  previewHtmlByPostId: Map<string, string>;
}): AiDigestSpec {
  const recommendations = recommendationItems(postSelection, previewHtmlByPostId);
  const discussion = discussionItems(threads, recommendations);
  const curated = curatedItems(curatedPosts, recommendations);
  return {
    recipientName: user.displayName,
    subject: postSelection.subject,
    preheader: postSelection.preheader,
    aiNote: {
      modelName: humanizeModelId(AI_DIGEST_SELECTION_MODEL_ID),
      paragraphs: postSelection.aiNote,
    },
    personalInstructions: personalInstructions ?? undefined,
    sections: [
      { kind: "recommendations", items: recommendations },
      ...(discussion.length > 0 ? [{ kind: "discussion" as const, title: "From the discussion", items: discussion }] : []),
      ...(curated.length > 0 ? [{ kind: "curated" as const, title: "Recently curated", items: curated }] : []),
    ],
  };
}

export async function generateAiDigestIssue({ user, context, trigger, countsTowardHistory }: {
  user: DbUser;
  context: ResolverContext;
  trigger: AiDigestIssueTrigger;
  countsTowardHistory: boolean;
}): Promise<{ issueId: string; spec: AiDigestSpec }> {
  const startedAt = Date.now();
  const asOf = new Date();
  const personalInstructions = user.aiDigestPersonalInstructions?.trim() || null;

  const history = await loadAiDigestHistory(user._id, context, asOf);
  const [profile, recentPosts, quickTakes, curatedPosts, threadCards] = await Promise.all([
    loadAiDigestReaderProfile(user, context, asOf),
    loadRecentAiDigestPostCandidates(user, context, asOf, history.previousInclusions),
    loadAiDigestQuickTakeCandidates(user, context, asOf, history.previousInclusions),
    context.repos.posts.getAiDigestRecentlyCuratedPosts({ userId: user._id, limit: CURATED_LOOKBACK_COUNT }),
    loadAiDigestThreadCards(user, context, asOf, history.previousInclusions),
  ]);
  const summarizedPosts = await ensureAiDigestPostSummaries({ candidates: recentPosts, context });
  const pool = aiDigestCandidatePool(summarizedPosts, quickTakes);

  const [postSelection, threadSelection] = await Promise.all([
    selectAiDigestPosts({ user, context, profile, pool, history, personalInstructions, asOf }),
    selectThreadsOrNone({ profile, cards: threadCards, personalInstructions, asOf }),
  ]);
  // Previews are only worth generating for the handful of posts that made the slate.
  const { previewHtmlByPostId } = await ensureAiDigestPostPreviews({
    targets: postSelection.items.flatMap((item) => item.documentType === "post" ? [item.post] : []),
    context,
  });
  const spec = buildAiDigestSpec({
    user,
    personalInstructions,
    postSelection,
    threads: threadSelection?.threads ?? [],
    curatedPosts,
    previewHtmlByPostId,
  });

  const issueId = await persistAiDigestIssue(
    { recipientId: user._id, trigger, countsTowardHistory, spec },
    {
      durationMs: Date.now() - startedAt,
      calls: threadSelection ? [postSelection.call, threadSelection.call] : [postSelection.call],
    },
  );
  serverCaptureEvent("aiDigestGenerated", { userId: user._id, issueId, trigger });
  return { issueId, spec };
}
