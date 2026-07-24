import React from "react";
import gql from "graphql-tag";
import { getUserEmail } from "@/lib/collections/users/helpers";
import { isDevelopment } from "@/lib/executionEnvironment";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import {
  generateAiDigestPostSelection,
} from "@/server/aiDigest/aiDigestPostSelection";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import Users from "@/server/collections/users/collection";
import { AiDigestEmail } from "@/server/emailComponents/AiDigestEmail";
import {
  type AiDigestSpec,
  rubyAiDigestSpec,
} from "@/server/emailComponents/AiDigestSpec";
import type { EmailContextType } from "@/server/emailComponents/emailContext";
import { wrapAndRenderEmail } from "@/server/emails/renderEmail";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

const MIN_SAMPLE_COUNT = 1;
const MAX_SAMPLE_COUNT = 3;
const DEFAULT_SAMPLE_COUNT = 3;
const SAMPLE_GENERATION_ATTEMPTS = 3;
const DEFAULT_STORED_SAMPLE_LIMIT = 50;
const MAX_STORED_SAMPLE_LIMIT = 100;

interface AiDigestEmailSampleSummary {
  issueId: string;
  subject: string;
  generatedAt: Date;
  selectionModelId: string;
}

function renderRubyDigest(emailContext: EmailContextType) {
  return <AiDigestEmail spec={rubyAiDigestSpec} emailContext={emailContext} />;
}

function digestEmailBody(spec: AiDigestSpec) {
  return function renderDigestEmail(emailContext: EmailContextType) {
    return <AiDigestEmail spec={spec} emailContext={emailContext} />;
  };
}

function boundedSampleCount(count: number | null | undefined): number {
  const requested = count ?? DEFAULT_SAMPLE_COUNT;
  return Math.max(MIN_SAMPLE_COUNT, Math.min(MAX_SAMPLE_COUNT, requested));
}

function boundedStoredSampleLimit(limit: number | null | undefined): number {
  const requested = limit ?? DEFAULT_STORED_SAMPLE_LIMIT;
  return Math.max(1, Math.min(MAX_STORED_SAMPLE_LIMIT, requested));
}

function assertAdminDevelopmentPreview(currentUser: DbUser | null): asserts currentUser is DbUser {
  if (!isDevelopment) {
    throw new Error("AI digest sample generation is only available in development");
  }
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

function storedSampleSummary(
  issue: Pick<DbAiDigestIssue, "_id" | "spec" | "generatedAt" | "selectionModelId">,
): AiDigestEmailSampleSummary {
  if (!issue.spec) {
    throw new Error(`AI digest issue ${issue._id} has no stored spec`);
  }
  return {
    issueId: issue._id,
    subject: issue.spec.subject,
    generatedAt: issue.generatedAt,
    selectionModelId: issue.selectionModelId,
  };
}

async function renderDigestSampleForUser({
  user,
  spec,
}: {
  user: DbUser;
  spec: AiDigestSpec;
}) {
  const userEmail = getUserEmail(user);
  if (!userEmail) {
    throw new Error(`User ${user.slug} has no email address`);
  }
  const resolverContext = computeContextFromUser({
    user,
    isSSR: false,
  });
  // AiDigestEmail uses the user-scoped resolver context, not the client-shaped currentUser fragment.
  const emailContext: EmailContextType = {
    resolverContext,
    stylesUsed: new Set(),
    currentUser: null,
  };
  return wrapAndRenderEmail({
    user,
    to: userEmail,
    subject: spec.subject,
    body: digestEmailBody(spec),
    emailContext,
  });
}

async function generateOneStoredDigestSample(user: DbUser): Promise<AiDigestEmailSampleSummary> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < SAMPLE_GENERATION_ATTEMPTS; attempt++) {
    try {
      const result = await generateAiDigestPostSelection({
        user,
        context: computeContextFromUser({
          user,
          isSSR: false,
        }),
      });
      if (!result.issueId) {
        throw new Error("Generated digest sample was not persisted");
      }
      return {
        issueId: result.issueId,
        subject: result.spec.subject,
        generatedAt: result.generatedAt,
        selectionModelId: result.metadata.selectionModelId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error("Failed to generate digest sample");
}

export const digestEmailPreviewGraphQLQueries = {
  async DigestEmailPreview(
    _root: void,
    _args: void,
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error("This debug feature is only available to admin accounts");
    }

    const userEmail = getUserEmail(currentUser);
    if (!userEmail) {
      throw new Error("The current user has no email address");
    }

    return wrapAndRenderEmail({
      user: currentUser,
      to: userEmail,
      subject: rubyAiDigestSpec.subject,
      body: renderRubyDigest,
    });
  },

  async AiDigestEmailSamples(
    _root: void,
    { userSlug, limit }: { userSlug: string; limit?: number | null },
    context: ResolverContext,
  ) {
    assertAdminDevelopmentPreview(context.currentUser);
    const user = await findUserBySlug(userSlug);
    const issues = await AiDigestIssues.find(
      {
        recipientId: user._id,
        spec: { $ne: null },
      },
      {
        sort: { generatedAt: -1, _id: -1 },
        limit: boundedStoredSampleLimit(limit),
      },
      {
        _id: 1,
        spec: 1,
        generatedAt: 1,
        selectionModelId: 1,
      },
    ).fetch();
    return issues.map(storedSampleSummary);
  },

  async AiDigestEmailSamplePreview(
    _root: void,
    { issueId }: { issueId: string },
    context: ResolverContext,
  ) {
    assertAdminDevelopmentPreview(context.currentUser);
    const issue = await AiDigestIssues.findOne(issueId);
    if (!issue?.spec) {
      throw new Error(`No stored AI digest sample found for issue ${issueId}`);
    }
    const user = await Users.findOne(issue.recipientId);
    if (!user) {
      throw new Error(`No recipient found for AI digest issue ${issueId}`);
    }
    const email = await renderDigestSampleForUser({
      user,
      spec: issue.spec,
    });
    return {
      email,
      selectionSystemPrompt: issue.selectionSystemPrompt,
      selectionUserPrompt: issue.selectionUserPrompt,
      inputTokenCount: issue.inputTokenCount,
      uncachedInputTokenCount: issue.uncachedInputTokenCount,
      cacheReadInputTokenCount: issue.cacheReadInputTokenCount,
      cacheWriteInputTokenCount: issue.cacheWriteInputTokenCount,
    };
  },
};

export const digestEmailPreviewGraphQLMutations = {
  async GenerateAiDigestEmailSamples(
    _root: void,
    { userSlug, count }: { userSlug: string; count?: number | null },
    context: ResolverContext,
  ) {
    assertAdminDevelopmentPreview(context.currentUser);

    const user = await findUserBySlug(userSlug);
    const sampleCount = boundedSampleCount(count);
    return Promise.all(
      Array.from({ length: sampleCount }, () => generateOneStoredDigestSample(user)),
    );
  },
};

export const digestEmailPreviewGraphQLTypeDefs = gql`
  type AiDigestEmailSampleSummary {
    issueId: String!
    subject: String!
    generatedAt: Date!
    selectionModelId: String!
  }

  type AiDigestEmailSamplePreview {
    email: EmailPreview!
    selectionSystemPrompt: String
    selectionUserPrompt: String
    inputTokenCount: Int
    uncachedInputTokenCount: Int
    cacheReadInputTokenCount: Int
    cacheWriteInputTokenCount: Int
  }

  extend type Query {
    DigestEmailPreview: EmailPreview!
    AiDigestEmailSamples(userSlug: String!, limit: Int): [AiDigestEmailSampleSummary!]!
    AiDigestEmailSamplePreview(issueId: String!): AiDigestEmailSamplePreview!
  }
  extend type Mutation {
    GenerateAiDigestEmailSamples(
      userSlug: String!
      count: Int
    ): [AiDigestEmailSampleSummary!]!
  }
`;
