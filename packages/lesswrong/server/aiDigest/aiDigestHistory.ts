import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import type { AiDigestSpec } from "@/server/emailComponents/AiDigestSpec";
import type { AiDigestPostInteractionRow } from "@/server/repos/PostsRepo";

export const AI_DIGEST_HISTORY_ISSUE_LIMIT = 8;

export type AiDigestIssueTrigger = "adminSample" | "userPreview" | "scheduled";

export interface AiDigestIssueRecord {
  _id: string;
  recipientId: string;
  postIds: string[];
  generatedAt: Date;
  selectionModelId: string;
  promptVersion: string;
}

export interface AiDigestPostHistory {
  previousDigestInclusionCount: number;
  lastIncludedAt: string | null;
}

export interface AiDigestPastRecommendation {
  postId: string;
  title: string;
  author: string;
  publicationDate: string;
  recommendedAt: string;
  subsequentlyRead: boolean;
  upvoteStrength: "regular" | "strong" | null;
  upvotedAt: string | null;
}

export interface AiDigestHistory {
  issues: AiDigestIssueRecord[];
  postHistoryById: Map<string, AiDigestPostHistory>;
  pastRecommendations: AiDigestPastRecommendation[];
}

export interface AiDigestSelectionTokenUsage {
  inputTokenCount: number | null;
  uncachedInputTokenCount: number | null;
  cacheReadInputTokenCount: number | null;
  cacheWriteInputTokenCount: number | null;
}

export interface AiDigestIssueInsert extends AiDigestSelectionTokenUsage {
  recipientId: string;
  postIds: string[];
  generatedAt: Date;
  trigger: AiDigestIssueTrigger;
  personalInstructions: string | null;
  selectionModelId: string;
  promptVersion: string;
  selectionSystemPrompt: string;
  selectionUserPrompt: string;
  spec: AiDigestSpec;
}

function boundedIssueLimit(limit: number): number {
  return Math.max(0, Math.min(limit, AI_DIGEST_HISTORY_ISSUE_LIMIT));
}

export function selectRecentAiDigestIssues(
  issues: AiDigestIssueRecord[],
  limit = AI_DIGEST_HISTORY_ISSUE_LIMIT,
): AiDigestIssueRecord[] {
  return [...issues]
    .sort((first, second) =>
      second.generatedAt.getTime() - first.generatedAt.getTime()
      || second._id.localeCompare(first._id),
    )
    .slice(0, boundedIssueLimit(limit));
}

export function buildAiDigestPostHistoryById(
  issues: AiDigestIssueRecord[],
): Map<string, AiDigestPostHistory> {
  const historyByPostId = new Map<string, AiDigestPostHistory>();
  issues.forEach((issue) => {
    issue.postIds.forEach((postId) => {
      const previous = historyByPostId.get(postId);
      const recommendedAt = issue.generatedAt.toISOString();
      historyByPostId.set(postId, {
        previousDigestInclusionCount: (previous?.previousDigestInclusionCount ?? 0) + 1,
        lastIncludedAt: !previous?.lastIncludedAt || previous.lastIncludedAt < recommendedAt
          ? recommendedAt
          : previous.lastIncludedAt,
      });
    });
  });
  return historyByPostId;
}

function occurredAfter(
  interactionAt: Date | null,
  recommendationAt: Date,
): boolean {
  return !!interactionAt && interactionAt > recommendationAt;
}

export function buildAiDigestPastRecommendations(
  issues: AiDigestIssueRecord[],
  interactions: AiDigestPostInteractionRow[],
): AiDigestPastRecommendation[] {
  const interactionsByPostId = new Map(
    interactions.map((interaction) => [interaction.postId, interaction]),
  );
  return issues
    .flatMap((issue) =>
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
          postId,
          title: interaction.title,
          author: interaction.author,
          publicationDate: interaction.publicationDate.toISOString(),
          recommendedAt: issue.generatedAt.toISOString(),
          subsequentlyRead: interaction.isRead
            && occurredAfter(interaction.readAt, issue.generatedAt),
          upvoteStrength: upvotedAt ? interaction.positivePreferenceStrength : null,
          upvotedAt,
        }];
      }),
    );
}

export function buildAiDigestHistory(
  issues: AiDigestIssueRecord[],
  interactions: AiDigestPostInteractionRow[],
): AiDigestHistory {
  return {
    issues,
    postHistoryById: buildAiDigestPostHistoryById(issues),
    pastRecommendations: buildAiDigestPastRecommendations(issues, interactions),
  };
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
    { recipientId: userId },
    { sort: { generatedAt: -1, _id: -1 }, limit },
    {
      _id: 1,
      recipientId: 1,
      postIds: 1,
      generatedAt: 1,
      selectionModelId: 1,
      promptVersion: 1,
    },
  ).fetch();
  const postIds = Array.from(new Set(issues.flatMap((issue) => issue.postIds)));
  const interactions = await context.repos.posts.getAiDigestPostInteractionRows({
    userId,
    postIds,
  });
  return buildAiDigestHistory(issues, interactions);
}

export async function persistAiDigestIssue(
  issue: AiDigestIssueInsert,
): Promise<string> {
  return await AiDigestIssues.rawInsert(issue);
}
