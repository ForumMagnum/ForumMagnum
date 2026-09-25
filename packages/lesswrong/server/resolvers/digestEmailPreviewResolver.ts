import gql from "graphql-tag";
import { getUserEmail } from "@/lib/collections/users/helpers";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { clearAiDigestRecommendationHistory } from "@/server/aiDigest/aiDigestHistory";
import {
  generateAiDigestPostSelection,
} from "@/server/aiDigest/aiDigestPostSelection";
import AiDigestIssueGenerations from "@/server/collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import Users from "@/server/collections/users/collection";
import { aiDigestEmailBody } from "@/server/emailComponents/AiDigestEmail";
import { AI_DIGEST_UTM_PARAMS } from "@/server/emailComponents/aiDigestEmailLinks";
import { wrapAndRenderEmail } from "@/server/emails/renderEmail";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

const MIN_SAMPLE_COUNT = 1;
const MAX_SAMPLE_COUNT = 3;
const DEFAULT_SAMPLE_COUNT = 3;

function boundedSampleCount(count: number | null | undefined): number {
  const requested = count ?? DEFAULT_SAMPLE_COUNT;
  return Math.max(MIN_SAMPLE_COUNT, Math.min(MAX_SAMPLE_COUNT, requested));
}

function assertAdminPreviewAccess(currentUser: DbUser | null): asserts currentUser is DbUser {
  if (!currentUser || !userIsAdmin(currentUser)) {
    throw new Error("This debug feature is only available to admin accounts");
  }
}

async function findUserBySlug(userSlug: string): Promise<DbUser> {
  const user = await Users.findOne({ slug: userSlug });
  if (!user) {
    throw new Error(`No user found for slug ${userSlug}`);
  }
  return user;
}

async function renderDigestSampleForUser({
  user,
  spec,
  issueId,
}: {
  user: DbUser;
  spec: AiDigestSpec;
  issueId: string;
}) {
  const userEmail = getUserEmail(user);
  if (!userEmail) {
    throw new Error(`User ${user.slug} has no email address`);
  }
  return wrapAndRenderEmail({
    forumType: "LessWrong",
    user,
    to: userEmail,
    subject: spec.subject,
    body: aiDigestEmailBody(spec, issueId),
    utmParams: AI_DIGEST_UTM_PARAMS,
  });
}

async function generateOneStoredDigestSample({
  user,
  countsTowardHistory,
}: {
  user: DbUser;
  countsTowardHistory: boolean;
}): Promise<string> {
  const result = await generateAiDigestPostSelection({
    user,
    context: computeContextFromUser({ user, isSSR: false }),
    options: { countsTowardHistory },
  });
  return result.issueId;
}

export const digestEmailPreviewGraphQLQueries = {
  async AiDigestEmailSamplePreview(
    _root: void,
    { issueId }: { issueId: string },
    context: ResolverContext,
  ) {
    assertAdminPreviewAccess(context.currentUser);
    const issue = await AiDigestIssues.findOne(issueId);
    if (!issue) {
      throw new Error(`No stored AI digest sample found for issue ${issueId}`);
    }
    const [user, generation] = await Promise.all([
      Users.findOne(issue.recipientId),
      AiDigestIssueGenerations.findOne({ issueId }),
    ]);
    if (!user || !generation) {
      throw new Error(`No recipient or generation record found for AI digest issue ${issueId}`);
    }
    const email = await renderDigestSampleForUser({
      user,
      spec: issue.spec,
      issueId,
    });
    return {
      email,
      durationMs: generation.durationMs,
      calls: generation.calls,
    };
  },
};

export const digestEmailPreviewGraphQLMutations = {
  async GenerateAiDigestEmailSamples(
    _root: void,
    {
      userSlug,
      count,
      countsTowardHistory,
    }: {
      userSlug: string;
      count?: number | null;
      countsTowardHistory?: boolean | null;
    },
    context: ResolverContext,
  ) {
    assertAdminPreviewAccess(context.currentUser);

    const user = await findUserBySlug(userSlug);
    const sampleCount = boundedSampleCount(count);
    return Promise.all(
      Array.from(
        { length: sampleCount },
        () => generateOneStoredDigestSample({
          user,
          countsTowardHistory: countsTowardHistory ?? true,
        }),
      ),
    );
  },

  async ClearAiDigestEmailSampleHistory(
    _root: void,
    { userSlug, days }: { userSlug: string; days: number },
    context: ResolverContext,
  ) {
    assertAdminPreviewAccess(context.currentUser);
    const user = await findUserBySlug(userSlug);
    return await clearAiDigestRecommendationHistory({
      recipientId: user._id,
      days,
    });
  },
};

export const digestEmailPreviewGraphQLTypeDefs = gql`
  type AiDigestModelCall {
    purpose: String!
    modelId: String!
    promptVersion: String!
    systemPrompt: String!
    prompt: String!
    inputTokenCount: Int
    outputTokenCount: Int
    uncachedInputTokenCount: Int
    cacheReadInputTokenCount: Int
    cacheWriteInputTokenCount: Int
    costUsd: Float
  }

  type AiDigestEmailSamplePreview {
    email: EmailPreview!
    durationMs: Int!
    calls: [AiDigestModelCall!]!
  }

  extend type Query {
    AiDigestEmailSamplePreview(issueId: String!): AiDigestEmailSamplePreview!
  }
  extend type Mutation {
    GenerateAiDigestEmailSamples(
      userSlug: String!
      count: Int
      countsTowardHistory: Boolean
    ): [String!]!
    ClearAiDigestEmailSampleHistory(
      userSlug: String!
      days: Int!
    ): Int!
  }
`;
