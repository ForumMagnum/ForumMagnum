import { AI_DIGEST_EMAIL_TYPE } from "@/lib/emails/emailTracking";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import EmailEvents from "@/server/collections/emailEvents/collection";
import type { AiDigestSpec } from "@/server/emailComponents/AiDigestSpec";
import type { AiDigestPostInteractionRow } from "@/server/repos/PostsRepo";
import type { AiDigestQuickTakeInteractionRow } from "@/server/repos/CommentsRepo";
import { boundedPlainTextFromRevisionHtml } from "./aiDigestPostSummaries";

/**
 * Enough issues to cover the full candidate window at the scheduled cadence,
 * with room to spare for admin previews, which also count toward history.
 */
export const AI_DIGEST_HISTORY_ISSUE_LIMIT = 14;
export const AI_DIGEST_CLEAR_HISTORY_MAX_DAYS = 3_650;
const AI_DIGEST_PAST_QUICK_TAKE_SNIPPET_MAX_CHARS = 160;
const DAY_MS = 24 * 60 * 60 * 1_000;

export type AiDigestIssueTrigger = "adminSample" | "userPreview" | "scheduled";

export interface AiDigestIssueRecord {
  _id: string;
  recipientId: string;
  postIds: string[];
  quickTakeIds: string[];
  discussionCommentIds: string[];
  generatedAt: Date;
  countsTowardHistory: boolean;
  selectionModelId: string;
  promptVersion: string;
}

export interface AiDigestPostHistory {
  previousDigestInclusionCount: number;
  lastIncludedAt: string | null;
}

export interface AiDigestPastPostRecommendation {
  documentType: "post";
  documentId: string;
  title: string;
  author: string;
  publicationDate: string;
  recommendedAt: string;
  subsequentlyRead: boolean;
  upvoteStrength: "regular" | "strong" | null;
  upvotedAt: string | null;
  /** When the recipient first clicked this post's link in the issue that recommended it. */
  clickedAt: string | null;
}

export interface AiDigestPastQuickTakeRecommendation {
  documentType: "quickTake";
  documentId: string;
  bodySnippet: string;
  author: string;
  publicationDate: string;
  recommendedAt: string;
  subsequentlyReplied: boolean;
  upvoteStrength: "regular" | "strong" | null;
  upvotedAt: string | null;
  /** When the recipient first clicked this quick take's link in the issue that recommended it. */
  clickedAt: string | null;
}

export type AiDigestPastRecommendation =
  | AiDigestPastPostRecommendation
  | AiDigestPastQuickTakeRecommendation;

/** A click on a digest link, as recorded by the Mailgun webhook. */
export interface AiDigestClickRecord {
  campaignId: string;
  documentId: string;
  occurredAt: Date;
}

export interface AiDigestHistory {
  issues: AiDigestIssueRecord[];
  postHistoryById: Map<string, AiDigestPostHistory>;
  pastRecommendations: AiDigestPastRecommendation[];
}

export interface AiDigestSelectionTokenUsage {
  inputTokenCount: number | null;
  outputTokenCount: number | null;
  uncachedInputTokenCount: number | null;
  cacheReadInputTokenCount: number | null;
  cacheWriteInputTokenCount: number | null;
}

export interface AiDigestIssueInsert extends AiDigestSelectionTokenUsage {
  recipientId: string;
  postIds: string[];
  quickTakeIds: string[];
  /** Anchor comment IDs of the issue's discussion-section threads. */
  discussionCommentIds: string[];
  generatedAt: Date;
  generationDurationMs: number;
  trigger: AiDigestIssueTrigger;
  countsTowardHistory: boolean;
  personalInstructions: string | null;
  selectionModelId: string;
  promptVersion: string;
  selectionSystemPrompt: string;
  selectionUserPrompt: string;
  selectionCostUsd: number | null;
  toolCallCount: number | null;
  searchCount: number | null;
  readPostCount: number | null;
  threadPromptVersion: string | null;
  threadSelectionUserPrompt: string | null;
  threadInputTokenCount: number | null;
  threadOutputTokenCount: number | null;
  threadCacheReadInputTokenCount: number | null;
  threadSelectionCostUsd: number | null;
  spec: AiDigestSpec;
}

function boundedIssueLimit(limit: number): number {
  return Math.max(0, Math.min(limit, AI_DIGEST_HISTORY_ISSUE_LIMIT));
}

export function selectRecentAiDigestIssues(
  issues: AiDigestIssueRecord[],
  limit = AI_DIGEST_HISTORY_ISSUE_LIMIT,
): AiDigestIssueRecord[] {
  return issues
    .filter((issue) => issue.countsTowardHistory)
    .sort((first, second) =>
      second.generatedAt.getTime() - first.generatedAt.getTime()
      || second._id.localeCompare(first._id),
    )
    .slice(0, boundedIssueLimit(limit));
}

function recordInclusion(
  historyByDocumentId: Map<string, AiDigestPostHistory>,
  documentId: string,
  recommendedAt: string,
): void {
  const previous = historyByDocumentId.get(documentId);
  historyByDocumentId.set(documentId, {
    previousDigestInclusionCount: (previous?.previousDigestInclusionCount ?? 0) + 1,
    lastIncludedAt: !previous?.lastIncludedAt || previous.lastIncludedAt < recommendedAt
      ? recommendedAt
      : previous.lastIncludedAt,
  });
}

export function buildAiDigestPostHistoryById(
  issues: AiDigestIssueRecord[],
): Map<string, AiDigestPostHistory> {
  const historyByDocumentId = new Map<string, AiDigestPostHistory>();
  issues.forEach((issue) => {
    const recommendedAt = issue.generatedAt.toISOString();
    issue.postIds.forEach((postId) => {
      recordInclusion(historyByDocumentId, postId, recommendedAt);
    });
    issue.quickTakeIds.forEach((commentId) => {
      recordInclusion(historyByDocumentId, commentId, recommendedAt);
    });
    issue.discussionCommentIds.forEach((commentId) => {
      recordInclusion(historyByDocumentId, commentId, recommendedAt);
    });
  });
  return historyByDocumentId;
}

function occurredAfter(
  interactionAt: Date | null,
  recommendationAt: Date,
): boolean {
  return !!interactionAt && interactionAt > recommendationAt;
}

function clickKey(campaignId: string, documentId: string): string {
  return `${campaignId}:${documentId}`;
}

/**
 * Earliest click per (issue, document). A single recommendation can generate several
 * click events — five links point at the same post, and scanners re-fetch them — but
 * for selection purposes the only question is whether and when they engaged.
 */
function firstClickByIssueAndDocument(
  clicks: AiDigestClickRecord[],
): Map<string, Date> {
  return clicks.reduce((earliest, click) => {
    const key = clickKey(click.campaignId, click.documentId);
    const previous = earliest.get(key);
    if (!previous || click.occurredAt < previous) {
      earliest.set(key, click.occurredAt);
    }
    return earliest;
  }, new Map<string, Date>());
}

function pastPostRecommendations(
  issues: AiDigestIssueRecord[],
  interactions: AiDigestPostInteractionRow[],
  firstClickAt: Map<string, Date>,
): AiDigestPastPostRecommendation[] {
  const interactionsByPostId = new Map(
    interactions.map((interaction) => [interaction.postId, interaction]),
  );
  return issues.flatMap((issue) =>
    issue.postIds.flatMap((postId) => {
      const interaction = interactionsByPostId.get(postId);
      if (!interaction) {
        return [];
      }
      const upvotedAt = occurredAfter(
        interaction.positivePreferenceAt,
        issue.generatedAt,
      )
        ? interaction.positivePreferenceAt?.toISOString() ?? null
        : null;
      return [{
        documentType: "post" as const,
        documentId: postId,
        title: interaction.title,
        author: interaction.author,
        publicationDate: interaction.publicationDate.toISOString(),
        recommendedAt: issue.generatedAt.toISOString(),
        subsequentlyRead: interaction.isRead
          && occurredAfter(interaction.readAt, issue.generatedAt),
        upvoteStrength: upvotedAt ? interaction.positivePreferenceStrength : null,
        upvotedAt,
        clickedAt: firstClickAt.get(clickKey(issue._id, postId))?.toISOString() ?? null,
      }];
    }),
  );
}

function pastQuickTakeRecommendations(
  issues: AiDigestIssueRecord[],
  interactions: AiDigestQuickTakeInteractionRow[],
  firstClickAt: Map<string, Date>,
): AiDigestPastQuickTakeRecommendation[] {
  const interactionsByCommentId = new Map(
    interactions.map((interaction) => [interaction.commentId, interaction]),
  );
  return issues.flatMap((issue) =>
    issue.quickTakeIds.flatMap((commentId) => {
      const interaction = interactionsByCommentId.get(commentId);
      if (!interaction) {
        return [];
      }
      const upvotedAt = occurredAfter(
        interaction.positivePreferenceAt,
        issue.generatedAt,
      )
        ? interaction.positivePreferenceAt?.toISOString() ?? null
        : null;
      return [{
        documentType: "quickTake" as const,
        documentId: commentId,
        bodySnippet: boundedPlainTextFromRevisionHtml(
          interaction.revisionHtml,
          AI_DIGEST_PAST_QUICK_TAKE_SNIPPET_MAX_CHARS,
        ),
        author: interaction.author,
        publicationDate: interaction.publicationDate.toISOString(),
        recommendedAt: issue.generatedAt.toISOString(),
        subsequentlyReplied: occurredAfter(interaction.repliedAt, issue.generatedAt),
        upvoteStrength: upvotedAt ? interaction.positivePreferenceStrength : null,
        upvotedAt,
        clickedAt: firstClickAt.get(clickKey(issue._id, commentId))?.toISOString() ?? null,
      }];
    }),
  );
}

export function buildAiDigestPastRecommendations(
  issues: AiDigestIssueRecord[],
  interactions: AiDigestPostInteractionRow[],
  clicks: AiDigestClickRecord[] = [],
  quickTakeInteractions: AiDigestQuickTakeInteractionRow[] = [],
): AiDigestPastRecommendation[] {
  const firstClickAt = firstClickByIssueAndDocument(clicks);
  return [
    ...pastPostRecommendations(issues, interactions, firstClickAt),
    ...pastQuickTakeRecommendations(issues, quickTakeInteractions, firstClickAt),
  ];
}

export function buildAiDigestHistory(
  issues: AiDigestIssueRecord[],
  interactions: AiDigestPostInteractionRow[],
  clicks: AiDigestClickRecord[] = [],
  quickTakeInteractions: AiDigestQuickTakeInteractionRow[] = [],
): AiDigestHistory {
  const countedIssues = issues.filter((issue) => issue.countsTowardHistory);
  return {
    issues: countedIssues,
    postHistoryById: buildAiDigestPostHistoryById(countedIssues),
    pastRecommendations: buildAiDigestPastRecommendations(
      countedIssues,
      interactions,
      clicks,
      quickTakeInteractions,
    ),
  };
}

/**
 * Clicks the recipient made on the supplied issues. Bot-flagged events are dropped;
 * email scanners and link proxies click links, so they would otherwise read as
 * engagement.
 */
async function loadAiDigestClicks({
  userId,
  issueIds,
}: {
  userId: string;
  issueIds: string[];
}): Promise<AiDigestClickRecord[]> {
  if (!issueIds.length) {
    return [];
  }
  const events = await EmailEvents.find(
    {
      userId,
      eventType: "clicked",
      emailType: AI_DIGEST_EMAIL_TYPE,
      campaignId: { $in: issueIds },
      isBot: { $ne: true },
    },
    {},
    { campaignId: 1, documentId: 1, occurredAt: 1 },
  ).fetch();
  return events.flatMap((event) =>
    event.campaignId && event.documentId
      ? [{
        campaignId: event.campaignId,
        documentId: event.documentId,
        occurredAt: event.occurredAt,
      }]
      : [],
  );
}

export async function loadAiDigestHistory({
  userId,
  context,
  issueLimit = AI_DIGEST_HISTORY_ISSUE_LIMIT,
}: {
  userId: string;
  context: ResolverContext;
  issueLimit?: number;
}): Promise<AiDigestHistory> {
  const limit = boundedIssueLimit(issueLimit);
  if (limit === 0) {
    return buildAiDigestHistory([], []);
  }
  const issues = await AiDigestIssues.find(
    {
      recipientId: userId,
      countsTowardHistory: true,
    },
    { sort: { generatedAt: -1, _id: -1 }, limit },
    {
      _id: 1,
      recipientId: 1,
      postIds: 1,
      quickTakeIds: 1,
      discussionCommentIds: 1,
      generatedAt: 1,
      countsTowardHistory: 1,
      selectionModelId: 1,
      promptVersion: 1,
    },
  ).fetch();
  const postIds = Array.from(new Set(issues.flatMap((issue) => issue.postIds)));
  const quickTakeIds = Array.from(
    new Set(issues.flatMap((issue) => issue.quickTakeIds)),
  );
  const [interactions, clicks, quickTakeInteractions] = await Promise.all([
    context.repos.posts.getAiDigestPostInteractionRows({
      userId,
      postIds,
    }),
    loadAiDigestClicks({
      userId,
      issueIds: issues.map((issue) => issue._id),
    }),
    context.repos.comments.getAiDigestQuickTakeInteractionRows({
      userId,
      commentIds: quickTakeIds,
    }),
  ]);
  return buildAiDigestHistory(
    issues,
    interactions,
    clicks,
    quickTakeInteractions,
  );
}

export async function persistAiDigestIssue(
  issue: AiDigestIssueInsert,
): Promise<string> {
  // An issue exists before it is mailed out, if it ever is; the scheduled send
  // stamps `emailedAt` once the email is actually accepted for delivery.
  return await AiDigestIssues.rawInsert({ ...issue, emailedAt: null });
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
  const generatedAfter = new Date(now.getTime() - (days * DAY_MS));
  const result = await AiDigestIssues.rawRemove({
    recipientId,
    countsTowardHistory: true,
    generatedAt: { $gte: generatedAfter },
  });
  return result.deletedCount;
}
