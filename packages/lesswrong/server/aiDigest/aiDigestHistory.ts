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

export interface AiDigestPreviousInclusion {
  count: number;
  lastIncludedAt: Date;
}

interface AiDigestPastRecommendationEvent {
  recommendedAt: Date;
  /** Posts: read afterwards. Quick takes: replied to afterwards. */
  engagedAfterward: boolean;
  likedAfterward: "regular" | "strong" | null;
  likedAt: Date | null;
  clickedAt: Date | null;
}

export type AiDigestPastRecommendation =
  | { type: "post"; title: string; author: string; postedAt: Date; recommendations: AiDigestPastRecommendationEvent[] }
  | { type: "quickTake"; snippet: string; author: string; postedAt: Date; recommendations: AiDigestPastRecommendationEvent[] };

export interface AiDigestHistory {
  previousInclusions: Map<string, AiDigestPreviousInclusion>;
  pastRecommendations: AiDigestPastRecommendation[];
}

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
    recommendations: recommendationEvents(
      items,
      { engagedAt: post.readAt, liked: post.liked, likedAt: post.likedAt },
      firstClickAtBySlotKey,
    ),
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
    recommendations: recommendationEvents(
      items,
      { engagedAt: quickTake.repliedAt, liked: quickTake.liked, likedAt: quickTake.likedAt },
      firstClickAtBySlotKey,
    ),
  };
}

async function loadFirstClickTimes(userId: string, since: Date, context: ResolverContext): Promise<Map<string, Date>> {
  const firstClickAt = new Map<string, Date>();
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
  if (issues.length === 0) {
    return { previousInclusions: new Map(), pastRecommendations: [] };
  }
  const oldestIssue = issues[issues.length - 1];
  const items = issues.flatMap(recommendedItems);
  const [postOutcomes, quickTakeOutcomes, firstClickAtBySlotKey] = await Promise.all([
    context.repos.posts.getAiDigestPastPostOutcomes({ userId, postIds: documentIdsOfType(items, "post") }),
    context.repos.comments.getAiDigestPastQuickTakeOutcomes({ userId, commentIds: documentIdsOfType(items, "quickTake") }),
    loadFirstClickTimes(userId, oldestIssue.createdAt, context),
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
  return await AiDigestIssues.rawUpdateMany({
    recipientId,
    countsTowardHistory: true,
    createdAt: { $gte: createdAfter },
  }, { $set: { countsTowardHistory: false } });
}
