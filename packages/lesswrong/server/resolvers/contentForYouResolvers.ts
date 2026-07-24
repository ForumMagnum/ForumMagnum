import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { generateAiDigestPostSelection } from "@/server/aiDigest/aiDigestPostSelection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";

const DEFAULT_ISSUE_LIMIT = 24;
const MAX_ISSUE_LIMIT = 50;
const GENERATION_COOLDOWN_MS = 10 * 60 * 1_000;
const GENERATION_WINDOW_MS = 24 * 60 * 60 * 1_000;
const GENERATION_LIMIT_PER_WINDOW = 10;

interface ContentForYouIssueSummary {
  issueId: string;
  subject: string;
  generatedAt: Date;
  trigger: string;
  personalInstructions: string | null;
}

interface ContentForYouGenerationStatus {
  nextAllowedAt: Date | null;
  generatedInLast24Hours: number;
  dailyLimit: number;
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
    "_id" | "spec" | "generatedAt" | "trigger" | "personalInstructions"
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
    personalInstructions: issue.personalInstructions,
  };
}

function laterDate(first: Date, second: Date): Date {
  return first > second ? first : second;
}

async function getContentForYouGenerationStatus(
  user: DbUser,
  now = new Date(),
): Promise<ContentForYouGenerationStatus> {
  if (userIsAdmin(user)) {
    return {
      nextAllowedAt: null,
      generatedInLast24Hours: 0,
      dailyLimit: GENERATION_LIMIT_PER_WINDOW,
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
      limit: GENERATION_LIMIT_PER_WINDOW,
    },
    {
      generatedAt: 1,
    },
  ).fetch();

  const latestIssue = recentIssues[0];
  const cooldownEnd = latestIssue
    ? new Date(latestIssue.generatedAt.getTime() + GENERATION_COOLDOWN_MS)
    : now;
  const oldestIssue = recentIssues.at(-1);
  const dailyLimitEnd = recentIssues.length >= GENERATION_LIMIT_PER_WINDOW && oldestIssue
    ? new Date(oldestIssue.generatedAt.getTime() + GENERATION_WINDOW_MS)
    : now;
  const nextAllowedAt = laterDate(cooldownEnd, dailyLimitEnd);

  return {
    nextAllowedAt: nextAllowedAt > now ? nextAllowedAt : null,
    generatedInLast24Hours: recentIssues.length,
    dailyLimit: GENERATION_LIMIT_PER_WINDOW,
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
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    return await getContentForYouGenerationStatus(currentUser);
  },
};

export const contentForYouGraphQLMutations = {
  async GenerateContentForYouIssue(
    _root: void,
    _args: void,
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);
    const beforeGeneration = await getContentForYouGenerationStatus(currentUser);
    if (beforeGeneration.nextAllowedAt) {
      throw new Error(
        `You can generate another Content for You sample after ${beforeGeneration.nextAllowedAt.toISOString()}`,
      );
    }

    const result = await generateAiDigestPostSelection({
      user: currentUser,
      context,
      options: {
        trigger: "userPreview",
      },
    });
    if (!result.issueId) {
      throw new Error("Generated Content for You issue was not persisted");
    }
    const afterGeneration = await getContentForYouGenerationStatus(currentUser);
    return {
      issue: {
        issueId: result.issueId,
        subject: result.spec.subject,
        generatedAt: result.generatedAt,
        trigger: "userPreview",
        personalInstructions: currentUser.aiDigestPersonalInstructions?.trim() || null,
      },
      nextAllowedAt: afterGeneration.nextAllowedAt,
    };
  },
};

export const contentForYouGraphQLTypeDefs = gql`
  type ContentForYouIssueSummary {
    issueId: String!
    subject: String!
    generatedAt: Date!
    trigger: String!
    personalInstructions: String
  }

  type ContentForYouIssue {
    issueId: String!
    subject: String!
    generatedAt: Date!
    trigger: String!
    personalInstructions: String
    spec: JSON!
  }

  type ContentForYouGenerationStatus {
    nextAllowedAt: Date
    generatedInLast24Hours: Int!
    dailyLimit: Int!
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
    GenerateContentForYouIssue: GenerateContentForYouIssueResult!
  }
`;
