import { captureException } from "@/lib/sentryWrapper";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import AiDigestIssueGenerations from "@/server/collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import type { AiDigestRecentlyCuratedPostRow } from "@/server/repos/PostsRepo";
import {
  aiDigestCandidatePool,
  loadAiDigestPostCandidates,
  loadAiDigestQuickTakeCandidates,
} from "./aiDigestCandidates";
import { loadAiDigestHistory } from "./aiDigestHistory";
import { AI_DIGEST_MODEL_NAME } from "./aiDigestModelCalls";
import { ensureAiDigestPostPreviews } from "./aiDigestPostPreviews";
import { isSelectedPost, selectAiDigestPosts, type AiDigestPostSelection, type AiDigestSelectedPost } from "./aiDigestPostSelection";
import { ensureAiDigestPostSummaries } from "./aiDigestPostSummaries";
import { loadAiDigestReaderProfile, type AiDigestReaderProfile } from "./aiDigestReaderProfile";
import { loadAiDigestThreadCards, type AiDigestThreadCard } from "./aiDigestThreadCandidates";
import { selectAiDigestThreads, type AiDigestSelectedThread } from "./aiDigestThreadSelection";

const CURATED_LOOKBACK_COUNT = 10;
const CURATED_ITEM_LIMIT = 3;

type AiDigestIssueTrigger = "adminSample" | "userPreview" | "scheduled";

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
    return await selectAiDigestThreads(options);
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error("AI digest thread selection failed; emitting issue without a discussion section", error);
    return null;
  }
}

function postItem(
  { post, reason }: AiDigestSelectedPost,
  placement: "headline" | "compact",
  previewHtmlByPostId: Map<string, string>,
): AiDigestItem {
  return {
    documentRef: { documentType: "post", documentId: post.postId },
    placement,
    reason,
    previewHtml: previewHtmlByPostId.get(post.postId),
  };
}

function recommendationItems(selection: AiDigestPostSelection, previewHtmlByPostId: Map<string, string>): AiDigestItem[] {
  const headlineItems = selection.headlinePosts.map((post) => postItem(post, "headline", previewHtmlByPostId));
  const otherItems = selection.otherItems.map((item): AiDigestItem => {
    if (item.documentType === "post") {
      return postItem(item, "compact", previewHtmlByPostId);
    }
    return {
      documentRef: { documentType: "quickTake", documentId: item.quickTake.commentId },
      placement: "full",
      reason: item.reason,
    };
  });
  return [...headlineItems, ...otherItems];
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
      modelName: AI_DIGEST_MODEL_NAME,
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

  const history = await loadAiDigestHistory(user._id, context);
  const { previousInclusions } = history;
  const [profile, recentPosts, quickTakes, curatedPosts, threadCards] = await Promise.all([
    loadAiDigestReaderProfile(user, context, asOf),
    loadAiDigestPostCandidates({ user, context, previousInclusions, asOf }),
    loadAiDigestQuickTakeCandidates(user, context, asOf, previousInclusions),
    context.repos.posts.getAiDigestRecentlyCuratedPosts({ userId: user._id, limit: CURATED_LOOKBACK_COUNT }),
    loadAiDigestThreadCards(user, context, asOf, previousInclusions),
  ]);
  const pool = aiDigestCandidatePool(recentPosts, quickTakes);
  const summarizedPosts = await ensureAiDigestPostSummaries(pool.posts, context);

  const [postSelection, threadSelection] = await Promise.all([
    selectAiDigestPosts({
      scope: { user, context, previousInclusions, repeatsAllowed: pool.repeatsAllowed, asOf },
      profile,
      posts: summarizedPosts,
      quickTakes: pool.quickTakes,
      pastRecommendations: history.pastRecommendations,
      personalInstructions,
    }),
    selectThreadsOrNone({ profile, cards: threadCards, personalInstructions, asOf }),
  ]);
  // Previews are only worth generating for the handful of posts that made the slate.
  const selectedPosts = [...postSelection.headlinePosts, ...postSelection.otherItems.filter(isSelectedPost)];
  const previewHtmlByPostId = await ensureAiDigestPostPreviews(selectedPosts.map(({ post }) => post), context);
  const spec = buildAiDigestSpec({
    user,
    personalInstructions,
    postSelection,
    threads: threadSelection?.threads ?? [],
    curatedPosts,
    previewHtmlByPostId,
  });

  // The scheduled send stamps `emailedAt` once the email is accepted for delivery.
  const issueId = await AiDigestIssues.rawInsert({ recipientId: user._id, trigger, countsTowardHistory, spec, emailedAt: null });
  await AiDigestIssueGenerations.rawInsert({
    issueId,
    durationMs: Date.now() - startedAt,
    calls: threadSelection ? [postSelection.call, threadSelection.call] : [postSelection.call],
  });
  serverCaptureEvent("aiDigestGenerated", { userId: user._id, issueId, trigger });
  return { issueId, spec };
}
