import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { clearAiDigestRecommendationHistory } from "@/server/aiDigest/aiDigestHistory";
import { generateAiDigestPostSelection } from "@/server/aiDigest/aiDigestPostSelection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import { createNotification } from "@/server/notificationCallbacksHelpers";

const DEFAULT_ISSUE_LIMIT = 24;
const MAX_ISSUE_LIMIT = 50;
const GENERATION_WINDOW_MS = 60 * 60 * 1_000;
const GENERATION_LIMIT_PER_HOUR = 10;
const ADMIN_GENERATION_LIMIT_PER_HOUR = 999;
const TYPICAL_DURATION_SAMPLE_SIZE = 50;

interface ContentForYouIssueSummary {
  issueId: string;
  subject: string;
  generatedAt: Date;
  trigger: string;
  countsTowardHistory: boolean;
  personalInstructions: string | null;
}

interface ContentForYouRateLimit {
  nextAllowedAt: Date | null;
  remainingThisHour: number;
  hourlyLimit: number;
}

interface ContentForYouGenerationStatus extends ContentForYouRateLimit {
  typicalDurationMsLow: number | null;
  typicalDurationMsHigh: number | null;
}

function assertContentForYouAccess(
  currentUser: DbUser | null,
): asserts currentUser is DbUser {
  if (!currentUser || !userIsAdmin(currentUser)) {
    throw new Error("Content for You is currently available only to admin accounts");
  }
}

function boundedIssueLimit(limit: number | null | undefined): number {
  return Math.max(1, Math.min(limit ?? DEFAULT_ISSUE_LIMIT, MAX_ISSUE_LIMIT));
}

function issueSummary(
  issue: Pick<
    DbAiDigestIssue,
    | "_id"
    | "spec"
    | "generatedAt"
    | "trigger"
    | "countsTowardHistory"
    | "personalInstructions"
  >,
): ContentForYouIssueSummary {
  if (!issue.spec) {
    throw new Error(`AI digest issue ${issue._id} has no stored spec`);
  }
  return {
    issueId: issue._id,
    subject: issue.spec.subject,
    generatedAt: issue.generatedAt,
    trigger: issue.trigger,
    countsTowardHistory: issue.countsTowardHistory,
    personalInstructions: issue.personalInstructions,
  };
}

async function getContentForYouRateLimit(
  user: DbUser,
  now = new Date(),
): Promise<ContentForYouRateLimit> {
  if (userIsAdmin(user)) {
    return {
      nextAllowedAt: null,
      remainingThisHour: ADMIN_GENERATION_LIMIT_PER_HOUR,
      hourlyLimit: ADMIN_GENERATION_LIMIT_PER_HOUR,
    };
  }

  const windowStart = new Date(now.getTime() - GENERATION_WINDOW_MS);
  const recentIssues = await AiDigestIssues.find(
    {
      recipientId: user._id,
      trigger: "userPreview",
      generatedAt: { $gt: windowStart },
    },
    {
      sort: { generatedAt: -1, _id: -1 },
      limit: GENERATION_LIMIT_PER_HOUR,
    },
    {
      generatedAt: 1,
    },
  ).fetch();

  const remainingThisHour = Math.max(0, GENERATION_LIMIT_PER_HOUR - recentIssues.length);
  const oldestIssue = recentIssues.at(-1);
  const nextAllowedAt = remainingThisHour === 0 && oldestIssue
    ? new Date(oldestIssue.generatedAt.getTime() + GENERATION_WINDOW_MS)
    : null;

  return {
    nextAllowedAt,
    remainingThisHour,
    hourlyLimit: GENERATION_LIMIT_PER_HOUR,
  };
}

/** percentile_cont-style linear interpolation over an ascending-sorted array */
function percentile(sortedValues: number[], fraction: number): number {
  const index = (sortedValues.length - 1) * fraction;
  const lowerValue = sortedValues[Math.floor(index)];
  const upperValue = sortedValues[Math.ceil(index)];
  return lowerValue + ((upperValue - lowerValue) * (index - Math.floor(index)));
}

/**
 * The p25-p75 range of recent generation durations, site-wide. Duration is a
 * property of the selection pipeline rather than of an individual reader, so
 * all recipients and triggers are pooled.
 */
async function getTypicalGenerationDurationRange(): Promise<
  { lowMs: number; highMs: number } | null
> {
  const recentIssues = await AiDigestIssues.find(
    { generationDurationMs: { $gt: 0 } },
    { sort: { generatedAt: -1, _id: -1 }, limit: TYPICAL_DURATION_SAMPLE_SIZE },
    { generationDurationMs: 1 },
  ).fetch();
  if (recentIssues.length === 0) {
    return null;
  }
  const durations = recentIssues
    .map((issue) => issue.generationDurationMs)
    .sort((a, b) => a - b);
  return {
    lowMs: Math.round(percentile(durations, 0.25)),
    highMs: Math.round(percentile(durations, 0.75)),
  };
}

export const contentForYouGraphQLQueries = {
  async ContentForYouIssues(
    _root: void,
    { limit }: { limit?: number | null },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    const issues = await AiDigestIssues.find(
      {
        recipientId: currentUser._id,
        spec: { $ne: null },
      },
      {
        sort: { generatedAt: -1, _id: -1 },
        limit: boundedIssueLimit(limit),
      },
      {
        _id: 1,
        spec: 1,
        generatedAt: 1,
        trigger: 1,
        countsTowardHistory: 1,
        personalInstructions: 1,
      },
    ).fetch();
    return issues.map(issueSummary);
  },

  async ContentForYouIssue(
    _root: void,
    { issueId }: { issueId: string },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    const issue = await AiDigestIssues.findOne({
      _id: issueId,
      recipientId: currentUser._id,
    });
    if (!issue?.spec) {
      throw new Error(`No Content for You issue found with ID ${issueId}`);
    }
    return {
      ...issueSummary(issue),
      spec: issue.spec,
    };
  },

  async ContentForYouGenerationStatus(
    _root: void,
    _args: void,
    context: ResolverContext,
  ): Promise<ContentForYouGenerationStatus> {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    const [rateLimit, typicalDuration] = await Promise.all([
      getContentForYouRateLimit(currentUser),
      getTypicalGenerationDurationRange(),
    ]);
    return {
      ...rateLimit,
      typicalDurationMsLow: typicalDuration?.lowMs ?? null,
      typicalDurationMsHigh: typicalDuration?.highMs ?? null,
    };
  },
};

export const contentForYouGraphQLMutations = {
  async GenerateContentForYouIssue(
    _root: void,
    { countsTowardHistory }: { countsTowardHistory?: boolean | null },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    const beforeGeneration = await getContentForYouRateLimit(currentUser);
    if (beforeGeneration.nextAllowedAt) {
      throw new Error(
        `You can generate another Content for You sample after ${beforeGeneration.nextAllowedAt.toISOString()}`,
      );
    }

    // Opting a sample out of recommendation history is an admin-only setting
    const effectiveCountsTowardHistory = userIsAdmin(currentUser)
      ? countsTowardHistory ?? true
      : true;
    const result = await generateAiDigestPostSelection({
      user: currentUser,
      context,
      options: {
        trigger: "userPreview",
        countsTowardHistory: effectiveCountsTowardHistory,
      },
    });
    if (!result.issueId) {
      throw new Error("Generated Content for You issue was not persisted");
    }

    // Generation takes long enough that the user may well have navigated away,
    // so tell them onsite when their issue is ready.
    await createNotification({
      userId: currentUser._id,
      notificationType: "aiDigestReady",
      documentType: null,
      documentId: null,
      extraData: { issueId: result.issueId, subject: result.spec.subject },
      context,
    });

    const afterGeneration = await getContentForYouRateLimit(currentUser);
    return {
      issue: {
        issueId: result.issueId,
        subject: result.spec.subject,
        generatedAt: result.generatedAt,
        trigger: "userPreview",
        countsTowardHistory: effectiveCountsTowardHistory,
        personalInstructions: currentUser.aiDigestPersonalInstructions?.trim() || null,
      },
      nextAllowedAt: afterGeneration.nextAllowedAt,
    };
  },

  async ClearContentForYouRecommendationHistory(
    _root: void,
    { days }: { days: number },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    return await clearAiDigestRecommendationHistory({
      recipientId: currentUser._id,
      days,
    });
  },
};

export const contentForYouGraphQLTypeDefs = gql`
  type ContentForYouIssueSummary {
    issueId: String!
    subject: String!
    generatedAt: Date!
    trigger: String!
    countsTowardHistory: Boolean!
    personalInstructions: String
  }

  type ContentForYouIssue {
    issueId: String!
    subject: String!
    generatedAt: Date!
    trigger: String!
    countsTowardHistory: Boolean!
    personalInstructions: String
    spec: JSON!
  }

  type ContentForYouGenerationStatus {
    nextAllowedAt: Date
    remainingThisHour: Int!
    hourlyLimit: Int!
    typicalDurationMsLow: Int
    typicalDurationMsHigh: Int
  }

  type GenerateContentForYouIssueResult {
    issue: ContentForYouIssueSummary!
    nextAllowedAt: Date
  }

  extend type Query {
    ContentForYouIssues(limit: Int): [ContentForYouIssueSummary!]!
    ContentForYouIssue(issueId: String!): ContentForYouIssue!
    ContentForYouGenerationStatus: ContentForYouGenerationStatus!
  }

  extend type Mutation {
    GenerateContentForYouIssue(
      countsTowardHistory: Boolean
    ): GenerateContentForYouIssueResult!
    ClearContentForYouRecommendationHistory(days: Int!): Int!
  }
`;
