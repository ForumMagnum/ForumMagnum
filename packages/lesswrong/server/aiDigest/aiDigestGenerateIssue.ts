import { captureException } from "@/lib/sentryWrapper";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import AiDigestIssueGenerations from "@/server/collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import { createNotification } from "@/server/notificationCallbacksHelpers";
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
  const recommendedQuickTakeIds = new Set(recommendations
    .filter(({ documentRef }) => documentRef.documentType === "quickTake")
    .map(({ documentRef }) => documentRef.documentId));
  const items: AiDigestItem[] = [];
  for (const { anchorCommentId, commentIds, reason } of threads) {
    const anchorIndex = commentIds.indexOf(anchorCommentId);
    const contextIds = commentIds.slice(0, anchorIndex);
    const anchorAndReplyIds = commentIds.slice(anchorIndex);
    if (anchorAndReplyIds.some((commentId) => recommendedQuickTakeIds.has(commentId))) {
      continue;
    }
    const contextOverlaps = contextIds.some((commentId) => recommendedQuickTakeIds.has(commentId));
    items.push({
      documentRef: { documentType: "comment", documentId: anchorCommentId },
      placement: "full",
      reason: reason ?? undefined,
      commentIds: contextOverlaps ? anchorAndReplyIds : commentIds,
    });
  }
  return items;
}

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
  const sections: AiDigestSection[] = [{ kind: "recommendations", items: recommendations }];
  if (discussion.length > 0) {
    sections.push({ kind: "discussion", title: "From the discussion", items: discussion });
  }
  if (curated.length > 0) {
    sections.push({ kind: "curated", title: "Recently curated", items: curated });
  }
  return {
    recipientName: user.displayName,
    subject: postSelection.subject,
    preheader: postSelection.preheader,
    aiNote: {
      modelName: AI_DIGEST_MODEL_NAME,
      paragraphs: postSelection.aiNote,
    },
    personalInstructions: personalInstructions ?? undefined,
    sections,
  };
}

export async function notifyAiDigestReady(reader: DbUser, issueId: string, spec: AiDigestSpec, context: ResolverContext) {
  await createNotification({
    userId: reader._id,
    notificationType: "aiDigestReady",
    documentType: null,
    documentId: null,
    extraData: { issueId, subject: spec.subject, aiNote: spec.aiNote.paragraphs },
    context,
  });
}

export async function generateAiDigestIssue({ user, context, trigger, countsTowardHistory }: {
  user: DbUser;
  context: ResolverContext;
  trigger: AiDigestIssueTrigger;
  countsTowardHistory: boolean;
}): Promise<{ issueId: string; spec: AiDigestSpec }> {
  const asOf = new Date();
  const personalInstructions = user.aiDigestPersonalInstructions?.trim() || null;

  const history = await loadAiDigestHistory(user._id, context);
  const candidateScope = { user, context, previousInclusions: history.previousInclusions, asOf };
  const [profile, recentPosts, quickTakes, curatedPosts, threadCards] = await Promise.all([
    loadAiDigestReaderProfile(user, context, asOf),
    loadAiDigestPostCandidates(candidateScope),
    loadAiDigestQuickTakeCandidates(candidateScope),
    context.repos.posts.getAiDigestRecentlyCuratedPosts({ userId: user._id, limit: CURATED_LOOKBACK_COUNT }),
    loadAiDigestThreadCards(candidateScope),
  ]);
  const pool = aiDigestCandidatePool(recentPosts, quickTakes);
  const summarizedPosts = await ensureAiDigestPostSummaries(pool.posts, context);

  const [postSelection, threadSelection] = await Promise.all([
    selectAiDigestPosts({
      scope: { ...candidateScope, repeatsAllowed: pool.repeatsAllowed },
      profile,
      posts: summarizedPosts,
      quickTakes: pool.quickTakes,
      pastRecommendations: history.pastRecommendations,
      personalInstructions,
    }),
    selectThreadsOrNone({ profile, cards: threadCards, personalInstructions, asOf }),
  ]);
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

  const issueId = await AiDigestIssues.rawInsert({ recipientId: user._id, trigger, countsTowardHistory, spec, emailedAt: null });
  await AiDigestIssueGenerations.rawInsert({
    issueId,
    durationMs: Date.now() - asOf.getTime(),
    calls: threadSelection ? [postSelection.call, threadSelection.call] : [postSelection.call],
  });
  serverCaptureEvent("aiDigestGenerated", { userId: user._id, issueId, trigger });
  return { issueId, spec };
}
