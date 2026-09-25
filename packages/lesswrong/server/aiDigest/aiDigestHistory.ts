import { AI_DIGEST_CLEAR_HISTORY_MAX_DAYS, DAY_MS } from "@/lib/aiDigest/constants";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import type { AiDigestPastQuickTakeOutcomeRow } from "@/server/repos/CommentsRepo";
import type { AiDigestPastPostOutcomeRow } from "@/server/repos/PostsRepo";
import {
  AI_DIGEST_UTM_PARAMS,
  aiDigestLinkSlotKey,
  aiDigestLinkSlotKeyFromUtmContent,
} from "@/server/emailComponents/aiDigestEmailLinks";
import groupBy from "lodash/groupBy";
import uniq from "lodash/uniq";
import { aiDigestPlainText } from "./aiDigestPostText";

/**
 * Enough issues to cover the full candidate window at the scheduled cadence,
 * with room to spare for admin previews, which also count toward history.
 */
const AI_DIGEST_HISTORY_ISSUE_LIMIT = 14;
const PAST_QUICK_TAKE_SNIPPET_MAX_CHARS = 160;

/** How often, and how recently, a document was recommended to the reader. */
export interface AiDigestPreviousInclusion {
  count: number;
  lastIncludedAt: Date;
}

/** One time an item was recommended, and what the reader did with it afterwards. */
interface AiDigestPastRecommendationEvent {
  recommendedAt: Date;
  /** Posts: read afterwards. Quick takes: replied to afterwards. */
  engagedAfterward: boolean;
  likedAfterward: "regular" | "strong" | null;
  likedAt: Date | null;
  clickedAt: Date | null;
}

type AiDigestPastRecommendation =
  | { type: "post"; title: string; author: string; postedAt: Date; recommendations: AiDigestPastRecommendationEvent[] }
  | { type: "quickTake"; snippet: string; author: string; postedAt: Date; recommendations: AiDigestPastRecommendationEvent[] };

export interface AiDigestHistory {
  previousInclusions: Map<string, AiDigestPreviousInclusion>;
  /** Shaped as it appears in the selection prompt. */
  pastRecommendations: AiDigestPastRecommendation[];
}

/** One item an issue recommended, and the slot key its links carry. */
type AiDigestRecommendedItem = AiDigestDocumentRef & {
  recommendedAt: Date;
  slotKey: string;
};

/**
 * The items an issue recommended: its selected posts and quick takes, and the
 * anchor comments of its discussion threads. The curated module is the same
 * for every reader, so it is not part of a reader's recommendation history.
 */
function recommendedItems(issue: Pick<DbAiDigestIssue, "_id" | "createdAt" | "spec">): AiDigestRecommendedItem[] {
  return issue.spec.sections
    .filter((section) => section.kind !== "curated")
    .flatMap((section) => section.items.map((item, itemIndex) => ({
      ...item.documentRef,
      recommendedAt: issue.createdAt,
      slotKey: aiDigestLinkSlotKey({ issueId: issue._id, sectionKind: section.kind, itemIndex }),
    })));
}

/** Expects the items newest first, so a document's first item is its latest. */
function previousInclusionsById(items: AiDigestRecommendedItem[]): Map<string, AiDigestPreviousInclusion> {
  const byId = new Map<string, AiDigestPreviousInclusion>();
  for (const { documentId, recommendedAt } of items) {
    const previous = byId.get(documentId);
    byId.set(documentId, {
      count: (previous?.count ?? 0) + 1,
      lastIncludedAt: previous?.lastIncludedAt ?? recommendedAt,
    });
  }
  return byId;
}

/** Only an interaction after the recommendation can be an outcome of it. */
function afterward(interactionAt: Date | null, recommendedAt: Date): Date | null {
  return interactionAt && interactionAt > recommendedAt ? interactionAt : null;
}

function recommendationEvents(
  items: AiDigestRecommendedItem[],
  outcome: { engagedAt: Date | null; liked: "regular" | "strong" | null; likedAt: Date | null },
  firstClickAtBySlotKey: Map<string, Date>,
): AiDigestPastRecommendationEvent[] {
  return items.map(({ recommendedAt, slotKey }) => {
    const likedAt = afterward(outcome.likedAt, recommendedAt);
    return {
      recommendedAt,
      engagedAfterward: !!afterward(outcome.engagedAt, recommendedAt),
      likedAfterward: likedAt ? outcome.liked : null,
      likedAt,
      clickedAt: firstClickAtBySlotKey.get(slotKey) ?? null,
    };
  });
}

function documentIdsOfType(items: AiDigestRecommendedItem[], documentType: AiDigestDocumentRef["documentType"]): string[] {
  return uniq(items.filter((item) => item.documentType === documentType).map((item) => item.documentId));
}

function pastPostRecommendation(
  post: AiDigestPastPostOutcomeRow,
  items: AiDigestRecommendedItem[],
  firstClickAtBySlotKey: Map<string, Date>,
): AiDigestPastRecommendation {
  return {
    type: "post",
    title: post.title,
    author: post.author,
    postedAt: post.postedAt,
    recommendations: recommendationEvents(items, { ...post, engagedAt: post.readAt }, firstClickAtBySlotKey),
  };
}

function pastQuickTakeRecommendation(
  quickTake: AiDigestPastQuickTakeOutcomeRow,
  items: AiDigestRecommendedItem[],
  firstClickAtBySlotKey: Map<string, Date>,
): AiDigestPastRecommendation {
  return {
    type: "quickTake",
    snippet: aiDigestPlainText(quickTake.html, PAST_QUICK_TAKE_SNIPPET_MAX_CHARS),
    author: quickTake.author,
    postedAt: quickTake.postedAt,
    recommendations: recommendationEvents(items, { ...quickTake, engagedAt: quickTake.repliedAt }, firstClickAtBySlotKey),
  };
}

/**
 * When the reader first visited each digest item from one of its links, by
 * slot key. One recommendation can lead to several visits, but the only
 * question here is whether and when the reader engaged.
 */
async function loadFirstClickTimes(
  userId: string,
  since: Date | undefined,
  context: ResolverContext,
): Promise<Map<string, Date>> {
  const firstClickAt = new Map<string, Date>();
  if (!since) {
    return firstClickAt;
  }
  const views = await context.repos.lwEvents.getPostViewsFromUtmCampaign(userId, AI_DIGEST_UTM_PARAMS.utm_campaign, since);
  for (const { utmContent, createdAt } of views) {
    const slotKey = aiDigestLinkSlotKeyFromUtmContent(utmContent);
    const previous = firstClickAt.get(slotKey);
    if (!previous || createdAt < previous) {
      firstClickAt.set(slotKey, createdAt);
    }
  }
  return firstClickAt;
}

export async function loadAiDigestHistory(userId: string, context: ResolverContext): Promise<AiDigestHistory> {
  const issues = await AiDigestIssues.find(
    { recipientId: userId, countsTowardHistory: true },
    { sort: { createdAt: -1, _id: -1 }, limit: AI_DIGEST_HISTORY_ISSUE_LIMIT },
    { _id: 1, createdAt: 1, spec: 1 },
  ).fetch();
  const items = issues.flatMap(recommendedItems);
  const [postOutcomes, quickTakeOutcomes, firstClickAtBySlotKey] = await Promise.all([
    // Both come back in the order of the IDs given, most recently recommended first.
    context.repos.posts.getAiDigestPastPostOutcomes({ userId, postIds: documentIdsOfType(items, "post") }),
    context.repos.comments.getAiDigestPastQuickTakeOutcomes({ userId, commentIds: documentIdsOfType(items, "quickTake") }),
    loadFirstClickTimes(userId, issues.at(-1)?.createdAt, context),
  ]);
  const itemsByDocumentId = groupBy(items, (item) => item.documentId);
  return {
    previousInclusions: previousInclusionsById(items),
    pastRecommendations: [
      ...postOutcomes.map((post) => pastPostRecommendation(post, itemsByDocumentId[post.postId], firstClickAtBySlotKey)),
      ...quickTakeOutcomes.map((quickTake) =>
        pastQuickTakeRecommendation(quickTake, itemsByDocumentId[quickTake.commentId], firstClickAtBySlotKey)),
    ],
  };
}

export async function clearAiDigestRecommendationHistory({
  recipientId,
  days,
  now = new Date(),
}: {
  recipientId: string;
  days: number;
  now?: Date;
}): Promise<number> {
  if (
    !Number.isInteger(days)
    || days < 1
    || days > AI_DIGEST_CLEAR_HISTORY_MAX_DAYS
  ) {
    throw new Error(
      `History window must be an integer from 1 to ${AI_DIGEST_CLEAR_HISTORY_MAX_DAYS} days`,
    );
  }
  const createdAfter = new Date(now.getTime() - (days * DAY_MS));
  // Only the history flag changes: cadence and click attribution still need the issues.
  return await AiDigestIssues.rawUpdateMany({
    recipientId,
    countsTowardHistory: true,
    createdAt: { $gte: createdAfter },
  }, { $set: { countsTowardHistory: false } });
}
