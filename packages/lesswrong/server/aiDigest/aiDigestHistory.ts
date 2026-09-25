import { AI_DIGEST_CLEAR_HISTORY_MAX_DAYS, DAY_MS } from "@/lib/aiDigest/constants";
import AiDigestIssueGenerations from "@/server/collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import {
  loadAiDigestPostInteractions,
  loadAiDigestQuickTakeInteractions,
  type AiDigestPostInteractionRow,
  type AiDigestQuickTakeInteractionRow,
} from "./aiDigestReaderSignals";
import { boundedPlainTextFromRevisionHtml } from "./aiDigestPostSummaries";

/**
 * Enough issues to cover the full candidate window at the scheduled cadence,
 * with room to spare for admin previews, which also count toward history.
 */
const AI_DIGEST_HISTORY_ISSUE_LIMIT = 14;
const AI_DIGEST_PAST_QUICK_TAKE_SNIPPET_MAX_CHARS = 160;

export type AiDigestIssueTrigger = "adminSample" | "userPreview" | "scheduled";

export interface AiDigestIssueRecord {
  _id: string;
  recipientId: string;
  postIds: string[];
  quickTakeIds: string[];
  discussionCommentIds: string[];
  createdAt: Date;
  countsTowardHistory: boolean;
}

export interface AiDigestPostHistory {
  previousDigestInclusionCount: number;
  lastIncludedAt: string | null;
}

interface AiDigestPastPostRecommendation {
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

interface AiDigestPastQuickTakeRecommendation {
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

interface AiDigestHistory {
  issues: AiDigestIssueRecord[];
  postHistoryById: Map<string, AiDigestPostHistory>;
  pastRecommendations: AiDigestPastRecommendation[];
}

export interface AiDigestIssueInsert {
  recipientId: string;
  trigger: AiDigestIssueTrigger;
  countsTowardHistory: boolean;
  spec: AiDigestSpec;
}

interface AiDigestIssueGenerationInsert {
  durationMs: number;
  calls: AiDigestModelCallRecord[];
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

function buildAiDigestPostHistoryById(
  issues: AiDigestIssueRecord[],
): Map<string, AiDigestPostHistory> {
  const historyByDocumentId = new Map<string, AiDigestPostHistory>();
  issues.forEach((issue) => {
    const recommendedAt = issue.createdAt.toISOString();
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
        issue.createdAt,
      )
        ? interaction.positivePreferenceAt?.toISOString() ?? null
        : null;
      return [{
        documentType: "post" as const,
        documentId: postId,
        title: interaction.title,
        author: interaction.author,
        publicationDate: interaction.publicationDate.toISOString(),
        recommendedAt: issue.createdAt.toISOString(),
        subsequentlyRead: interaction.isRead
          && occurredAfter(interaction.readAt, issue.createdAt),
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
        issue.createdAt,
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
        recommendedAt: issue.createdAt.toISOString(),
        subsequentlyReplied: occurredAfter(interaction.repliedAt, issue.createdAt),
        upvoteStrength: upvotedAt ? interaction.positivePreferenceStrength : null,
        upvotedAt,
        clickedAt: firstClickAt.get(clickKey(issue._id, commentId))?.toISOString() ?? null,
      }];
    }),
  );
}

function buildAiDigestPastRecommendations(
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

function specDocumentIds(spec: AiDigestSpec, documentType: AiDigestDocumentRef["documentType"]): string[] {
  return spec.sections
    .filter((section) => section.kind !== "curated")
    .flatMap((section) => section.items)
    .flatMap(({ documentRef }) => documentRef.documentType === documentType ? [documentRef.documentId] : []);
}

/**
 * The items an issue recommended: its selected posts and quick takes, and the
 * anchor comments of its discussion threads. The curated module is the same
 * for every reader, so it is not part of a reader's recommendation history.
 */
function toAiDigestIssueRecord(issue: Pick<DbAiDigestIssue, "_id" | "recipientId" | "createdAt" | "countsTowardHistory" | "spec">): AiDigestIssueRecord {
  return {
    _id: issue._id,
    recipientId: issue.recipientId,
    postIds: specDocumentIds(issue.spec, "post"),
    quickTakeIds: specDocumentIds(issue.spec, "quickTake"),
    discussionCommentIds: specDocumentIds(issue.spec, "comment"),
    createdAt: issue.createdAt,
    countsTowardHistory: issue.countsTowardHistory,
  };
}

export async function loadAiDigestHistory(userId: string): Promise<AiDigestHistory> {
  const issues = (await AiDigestIssues.find(
    {
      recipientId: userId,
      countsTowardHistory: true,
    },
    { sort: { createdAt: -1, _id: -1 }, limit: AI_DIGEST_HISTORY_ISSUE_LIMIT },
    {
      _id: 1,
      recipientId: 1,
      createdAt: 1,
      countsTowardHistory: 1,
      spec: 1,
    },
  ).fetch()).map(toAiDigestIssueRecord);
  const postIds = Array.from(new Set(issues.flatMap((issue) => issue.postIds)));
  const quickTakeIds = Array.from(
    new Set(issues.flatMap((issue) => issue.quickTakeIds)),
  );
  const [interactions, quickTakeInteractions] = await Promise.all([
    loadAiDigestPostInteractions({ userId, postIds }),
    loadAiDigestQuickTakeInteractions({ userId, commentIds: quickTakeIds }),
  ]);
  return buildAiDigestHistory(
    issues,
    interactions,
    [],
    quickTakeInteractions,
  );
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
  // Delivery timestamps and campaign IDs remain needed for cadence and click attribution.
  return await AiDigestIssues.rawUpdateMany({
    recipientId,
    countsTowardHistory: true,
    createdAt: { $gte: createdAfter },
  }, { $set: { countsTowardHistory: false } });
}
