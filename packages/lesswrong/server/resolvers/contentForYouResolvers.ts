import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { clearAiDigestRecommendationHistory } from "@/server/aiDigest/aiDigestHistory";
import { generateAiDigestPostSelection } from "@/server/aiDigest/aiDigestPostSelection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import { createNotification } from "@/server/notificationCallbacksHelpers";

const GENERATION_WINDOW_MS = 60 * 60 * 1_000;
const GENERATION_LIMIT_PER_HOUR = 10;
const ADMIN_GENERATION_LIMIT_PER_HOUR = 999;
const TYPICAL_DURATION_SAMPLE_SIZE = 50;

export interface ContentForYouRateLimit {
  nextAllowedAt: Date | null;
  remainingThisHour: number;
}

/**
 * The reader's remaining generations this hour, and when the next one is
 * allowed once they are used up: the window reopens when the oldest of the
 * counted generations ages out of it. Times outside the window are ignored.
 */
export function contentForYouRateLimitFromGenerations(
  generationTimes: Date[],
  now: Date,
): ContentForYouRateLimit {
  const windowStart = now.getTime() - GENERATION_WINDOW_MS;
  const countedTimes = generationTimes
    .filter((time) => time.getTime() > windowStart)
    .sort((first, second) => second.getTime() - first.getTime())
    .slice(0, GENERATION_LIMIT_PER_HOUR);
  const remainingThisHour = Math.max(0, GENERATION_LIMIT_PER_HOUR - countedTimes.length);
  const oldestCountedTime = countedTimes.at(-1);
  const nextAllowedAt = remainingThisHour === 0 && oldestCountedTime
    ? new Date(oldestCountedTime.getTime() + GENERATION_WINDOW_MS)
    : null;
  return { nextAllowedAt, remainingThisHour };
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

async function getContentForYouRateLimit(
  user: DbUser,
  now = new Date(),
): Promise<ContentForYouRateLimit> {
  if (userIsAdmin(user)) {
    return {
      nextAllowedAt: null,
      remainingThisHour: ADMIN_GENERATION_LIMIT_PER_HOUR,
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
  return contentForYouRateLimitFromGenerations(
    recentIssues.map((issue) => issue.generatedAt),
    now,
  );
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
    // Generation takes long enough that the user may well have navigated away,
    // so tell them onsite when their issue is ready.
    await createNotification({
      userId: currentUser._id,
      notificationType: "aiDigestReady",
      documentType: null,
      documentId: null,
      extraData: {
        issueId: result.issueId,
        subject: result.spec.subject,
        aiNote: result.spec.aiNote.paragraphs,
      },
      context,
    });

    const afterGeneration = await getContentForYouRateLimit(currentUser);
    return {
      issueId: result.issueId,
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
  type ContentForYouGenerationStatus {
    nextAllowedAt: Date
    remainingThisHour: Int!
    typicalDurationMsLow: Int
    typicalDurationMsHigh: Int
  }

  type GenerateContentForYouIssueResult {
    issueId: String!
    nextAllowedAt: Date
  }

  extend type Query {
    ContentForYouGenerationStatus: ContentForYouGenerationStatus!
  }

  extend type Mutation {
    GenerateContentForYouIssue(
      countsTowardHistory: Boolean
    ): GenerateContentForYouIssueResult!
    ClearContentForYouRecommendationHistory(days: Int!): Int!
  }
`;
