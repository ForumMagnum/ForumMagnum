import { AI_DIGEST_CLEAR_HISTORY_MAX_DAYS, DAY_MS } from "@/lib/aiDigest/constants";
import { daysAgo } from "@/lib/aiDigest/helpers";
import AiDigestIssueGenerations from "@/server/collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import { AI_DIGEST_UTM_PARAMS, parseAiDigestItemLinkContent } from "@/server/emailComponents/aiDigestEmailLinks";
import type { AiDigestPastQuickTakeOutcomeRow } from "@/server/repos/CommentsRepo";
import type { AiDigestPastPostOutcomeRow } from "@/server/repos/PostsRepo";
import { boundedPlainTextFromRevisionHtml } from "./aiDigestPostSummaries";
import uniq from "lodash/uniq";

/**
 * Enough issues to cover the full candidate window at the scheduled cadence,
 * with room to spare for admin previews, which also count toward history.
 */
const AI_DIGEST_HISTORY_ISSUE_LIMIT = 14;
const PAST_QUICK_TAKE_SNIPPET_MAX_CHARS = 160;

export type AiDigestIssueTrigger = "adminSample" | "userPreview" | "scheduled";

/** How often, and how recently, a document was recommended to the reader. */
export interface AiDigestPreviousInclusion {
  count: number;
  lastIncludedAt: Date;
}

/** One time an item was recommended, and what the reader did with it afterwards. */
interface AiDigestPastRecommendationEvent {
  recommendedDaysAgo: number;
  /** Posts: read afterwards. Quick takes: replied to afterwards. */
  engagedAfterward?: true;
  likedAfterward?: "regular" | "strong";
  likedDaysAgo?: number;
  clickedDaysAgo?: number;
}

type AiDigestPastRecommendation =
  | { type: "post"; title: string; author: string; publishedDaysAgo: number; recommendations: AiDigestPastRecommendationEvent[] }
  | { type: "quickTake"; snippet: string; author: string; publishedDaysAgo: number; recommendations: AiDigestPastRecommendationEvent[] };

export interface AiDigestHistory {
  previousInclusions: Map<string, AiDigestPreviousInclusion>;
  /** Shaped as it appears in the selection prompt, with day offsets before `asOf`. */
  pastRecommendations: AiDigestPastRecommendation[];
}

/** A visit to the site from a digest item link. */
interface AiDigestClick {
  issueId: string;
  documentId: string;
  occurredAt: Date;
}

type AiDigestHistoryIssue = Pick<DbAiDigestIssue, "_id" | "createdAt" | "spec">;

interface AiDigestPastRecommendationOutcome {
  recommendation: AiDigestPastRecommendation;
  engagedAt: Date | null;
  liked: "regular" | "strong" | null;
  likedAt: Date | null;
}

interface AiDigestIssueInsert {
  recipientId: string;
  trigger: AiDigestIssueTrigger;
  countsTowardHistory: boolean;
  spec: AiDigestSpec;
}

interface AiDigestIssueGenerationInsert {
  durationMs: number;
  calls: AiDigestModelCallRecord[];
}

/**
 * The items an issue recommended: its selected posts and quick takes, and the
 * anchor comments of its discussion threads. The curated module is the same
 * for every reader, so it is not part of a reader's recommendation history.
 */
function recommendedDocumentRefs(spec: AiDigestSpec): AiDigestDocumentRef[] {
  return spec.sections
    .filter((section) => section.kind !== "curated")
    .flatMap((section) => section.items.map((item) => item.documentRef));
}

function documentIdsOfType(refs: AiDigestDocumentRef[], documentType: AiDigestDocumentRef["documentType"]): string[] {
  return uniq(refs.filter((ref) => ref.documentType === documentType).map((ref) => ref.documentId));
}

function clickKey(issueId: string, documentId: string): string {
  return `${issueId}:${documentId}`;
}

/** Only an interaction after the recommendation can be an outcome of it. */
function afterward(interactionAt: Date | null, recommendedAt: Date): Date | null {
  return interactionAt && interactionAt > recommendedAt ? interactionAt : null;
}

function optionalDaysAgo(asOf: Date, date: Date | null | undefined): number | undefined {
  return date ? daysAgo(asOf, date) : undefined;
}

function previousInclusionsById(issues: AiDigestHistoryIssue[]): Map<string, AiDigestPreviousInclusion> {
  const byId = new Map<string, AiDigestPreviousInclusion>();
  for (const issue of issues) {
    for (const { documentId } of recommendedDocumentRefs(issue.spec)) {
      const previous = byId.get(documentId);
      byId.set(documentId, {
        count: (previous?.count ?? 0) + 1,
        lastIncludedAt: previous && previous.lastIncludedAt > issue.createdAt ? previous.lastIncludedAt : issue.createdAt,
      });
    }
  }
  return byId;
}

/**
 * Earliest visit per (issue, document). One recommendation can lead to several
 * visits, but the only question here is whether and when the reader engaged.
 */
function firstClickTimes(clicks: AiDigestClick[]): Map<string, Date> {
  const earliest = new Map<string, Date>();
  for (const click of clicks) {
    const key = clickKey(click.issueId, click.documentId);
    const previous = earliest.get(key);
    if (!previous || click.occurredAt < previous) {
      earliest.set(key, click.occurredAt);
    }
  }
  return earliest;
}

function postOutcome(row: AiDigestPastPostOutcomeRow, asOf: Date): AiDigestPastRecommendationOutcome {
  return {
    recommendation: {
      type: "post",
      title: row.title,
      author: row.author,
      publishedDaysAgo: daysAgo(asOf, row.postedAt),
      recommendations: [],
    },
    engagedAt: row.readAt,
    liked: row.liked,
    likedAt: row.likedAt,
  };
}

function quickTakeOutcome(row: AiDigestPastQuickTakeOutcomeRow, asOf: Date): AiDigestPastRecommendationOutcome {
  return {
    recommendation: {
      type: "quickTake",
      snippet: boundedPlainTextFromRevisionHtml(row.html, PAST_QUICK_TAKE_SNIPPET_MAX_CHARS),
      author: row.author,
      publishedDaysAgo: daysAgo(asOf, row.postedAt),
      recommendations: [],
    },
    engagedAt: row.repliedAt,
    liked: row.liked,
    likedAt: row.likedAt,
  };
}

export function buildAiDigestHistory({ issues, postOutcomes, quickTakeOutcomes, clicks, asOf }: {
  /** The reader's counted issues, newest first. */
  issues: AiDigestHistoryIssue[];
  postOutcomes: AiDigestPastPostOutcomeRow[];
  quickTakeOutcomes: AiDigestPastQuickTakeOutcomeRow[];
  clicks: AiDigestClick[];
  asOf: Date;
}): AiDigestHistory {
  const firstClickAt = firstClickTimes(clicks);
  const outcomesById = new Map<string, AiDigestPastRecommendationOutcome>();
  for (const row of postOutcomes) {
    outcomesById.set(row.postId, postOutcome(row, asOf));
  }
  for (const row of quickTakeOutcomes) {
    outcomesById.set(row.commentId, quickTakeOutcome(row, asOf));
  }
  const pastRecommendations: AiDigestPastRecommendation[] = [];
  for (const issue of issues) {
    for (const { documentId } of recommendedDocumentRefs(issue.spec)) {
      const outcome = outcomesById.get(documentId);
      if (!outcome) {
        continue;
      }
      const { recommendations } = outcome.recommendation;
      if (recommendations.length === 0) {
        pastRecommendations.push(outcome.recommendation);
      }
      const likedAt = afterward(outcome.likedAt, issue.createdAt);
      recommendations.push({
        recommendedDaysAgo: daysAgo(asOf, issue.createdAt),
        engagedAfterward: afterward(outcome.engagedAt, issue.createdAt) ? true : undefined,
        likedAfterward: likedAt ? outcome.liked ?? undefined : undefined,
        likedDaysAgo: optionalDaysAgo(asOf, likedAt),
        clickedDaysAgo: optionalDaysAgo(asOf, firstClickAt.get(clickKey(issue._id, documentId))),
      });
    }
  }
  return {
    previousInclusions: previousInclusionsById(issues),
    pastRecommendations,
  };
}

/** Visits from item links in the given issues, resolved to the item each link belonged to. */
async function loadAiDigestClicks(
  userId: string,
  issues: AiDigestHistoryIssue[],
  context: ResolverContext,
): Promise<AiDigestClick[]> {
  const oldestIssue = issues.at(-1);
  if (!oldestIssue) {
    return [];
  }
  const views = await context.repos.lwEvents.getPostViewsFromUtmCampaign(
    userId,
    AI_DIGEST_UTM_PARAMS.utm_campaign,
    oldestIssue.createdAt,
  );
  const specsByIssueId = new Map(issues.map((issue) => [issue._id, issue.spec]));
  return views.flatMap(({ utmContent, createdAt }) => {
    const slot = parseAiDigestItemLinkContent(utmContent);
    const documentId = slot && specsByIssueId.get(slot.issueId)?.sections
      .find((section) => section.kind === slot.sectionKind)
      ?.items[slot.itemIndex]?.documentRef.documentId;
    return slot && documentId
      ? [{ issueId: slot.issueId, documentId, occurredAt: createdAt }]
      : [];
  });
}

export async function loadAiDigestHistory(userId: string, context: ResolverContext, asOf: Date): Promise<AiDigestHistory> {
  const issues = await AiDigestIssues.find(
    { recipientId: userId, countsTowardHistory: true },
    { sort: { createdAt: -1, _id: -1 }, limit: AI_DIGEST_HISTORY_ISSUE_LIMIT },
    { _id: 1, createdAt: 1, spec: 1 },
  ).fetch();
  const documentRefs = issues.flatMap((issue) => recommendedDocumentRefs(issue.spec));
  const [postOutcomes, quickTakeOutcomes, clicks] = await Promise.all([
    context.repos.posts.getAiDigestPastPostOutcomes({ userId, postIds: documentIdsOfType(documentRefs, "post") }),
    context.repos.comments.getAiDigestPastQuickTakeOutcomes({ userId, commentIds: documentIdsOfType(documentRefs, "quickTake") }),
    loadAiDigestClicks(userId, issues, context),
  ]);
  return buildAiDigestHistory({ issues, postOutcomes, quickTakeOutcomes, clicks, asOf });
}

export async function persistAiDigestIssue(
  issue: AiDigestIssueInsert,
  generation: AiDigestIssueGenerationInsert,
): Promise<string> {
  // An issue exists before it is mailed out, if it ever is; the scheduled send
  // stamps `emailedAt` once the email is actually accepted for delivery.
  const issueId = await AiDigestIssues.rawInsert({ ...issue, emailedAt: null });
  await AiDigestIssueGenerations.rawInsert({ issueId, ...generation });
  return issueId;
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
