import gql from "graphql-tag";
import { getUserEmail } from "@/lib/collections/users/helpers";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { generateAiDigestIssue, notifyAiDigestReady } from "@/server/aiDigest/aiDigestGenerateIssue";
import { clearAiDigestRecommendationHistory } from "@/server/aiDigest/aiDigestHistory";
import AiDigestIssueGenerations from "@/server/collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import Users from "@/server/collections/users/collection";
import { aiDigestEmailBody } from "@/server/emailComponents/AiDigestEmail";
import { AI_DIGEST_UTM_PARAMS } from "@/server/emailComponents/aiDigestEmailLinks";
import { wrapAndRenderEmail } from "@/server/emails/renderEmail";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

/** Issues generated per request, in parallel. */
const MAX_ISSUES_PER_REQUEST = 3;

function assertAiDigestAccess(currentUser: DbUser | null): asserts currentUser is DbUser {
  if (!currentUser || !userIsAdmin(currentUser)) {
    throw new Error("AI digests are currently only available to admin accounts");
  }
}

/** The named reader, or the current user when none is named. */
async function aiDigestReader(currentUser: DbUser, userSlug: string | null | undefined): Promise<DbUser> {
  if (!userSlug || userSlug === currentUser.slug) {
    return currentUser;
  }
  const user = await Users.findOne({ slug: userSlug });
  if (!user) {
    throw new Error(`No user found for slug ${userSlug}`);
  }
  return user;
}

async function generateIssueForReader(reader: DbUser, currentUser: DbUser, countsTowardHistory: boolean): Promise<string> {
  const isOwnIssue = reader._id === currentUser._id;
  const readerContext = computeContextFromUser({ user: reader, isSSR: false });
  const { issueId, spec } = await generateAiDigestIssue({
    user: reader,
    context: readerContext,
    trigger: isOwnIssue ? "userPreview" : "adminSample",
    countsTowardHistory,
  });
  // Readers may navigate away while their own issue generates, so tell them when it's ready.
  if (isOwnIssue) {
    await notifyAiDigestReady(reader, issueId, spec, readerContext);
  }
  return issueId;
}

export const aiDigestGraphQLQueries = {
  /** An issue rendered as the email its reader would get, with how it was generated. */
  async AiDigestEmailSamplePreview(
    _root: void,
    { issueId }: { issueId: string },
    context: ResolverContext,
  ) {
    assertAiDigestAccess(context.currentUser);
    const issue = await AiDigestIssues.findOne(issueId);
    if (!issue) {
      throw new Error(`No AI digest issue ${issueId}`);
    }
    const [user, generation] = await Promise.all([
      Users.findOne(issue.recipientId),
      AiDigestIssueGenerations.findOne({ issueId }),
    ]);
    const userEmail = user && getUserEmail(user);
    if (!user || !userEmail || !generation) {
      throw new Error(`No recipient email or generation record for AI digest issue ${issueId}`);
    }
    const email = await wrapAndRenderEmail({
      forumType: "LessWrong",
      user,
      to: userEmail,
      subject: issue.spec.subject,
      body: aiDigestEmailBody(issue.spec, issueId),
      utmParams: AI_DIGEST_UTM_PARAMS,
    });
    return {
      email,
      durationMs: generation.durationMs,
      calls: generation.calls,
    };
  },
};

export const aiDigestGraphQLMutations = {
  /** Generates issues for a reader (by default, the current user) and returns their IDs. */
  async GenerateAiDigestIssues(
    _root: void,
    { userSlug, count, countsTowardHistory }: {
      userSlug?: string | null;
      count?: number | null;
      countsTowardHistory?: boolean | null;
    },
    context: ResolverContext,
  ): Promise<string[]> {
    const { currentUser } = context;
    assertAiDigestAccess(currentUser);
    const reader = await aiDigestReader(currentUser, userSlug);
    const issueCount = Math.max(1, Math.min(MAX_ISSUES_PER_REQUEST, count ?? 1));
    return Promise.all(Array.from(
      { length: issueCount },
      () => generateIssueForReader(reader, currentUser, countsTowardHistory ?? true),
    ));
  },

  /** Stops a reader's recent issues (by default, the current user's) from counting toward their recommendation history. */
  async ClearAiDigestRecommendationHistory(
    _root: void,
    { userSlug, days }: { userSlug?: string | null; days: number },
    context: ResolverContext,
  ): Promise<number> {
    const { currentUser } = context;
    assertAiDigestAccess(currentUser);
    const reader = await aiDigestReader(currentUser, userSlug);
    return await clearAiDigestRecommendationHistory({ recipientId: reader._id, days });
  },
};

export const aiDigestGraphQLTypeDefs = gql`
  type AiDigestToolCall {
    toolName: String!
    input: String!
  }

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
    toolCalls: [AiDigestToolCall!]!
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
    GenerateAiDigestIssues(
      userSlug: String
      count: Int
      countsTowardHistory: Boolean
    ): [String!]!
    ClearAiDigestRecommendationHistory(
      userSlug: String
      days: Int!
    ): Int!
  }
`;
