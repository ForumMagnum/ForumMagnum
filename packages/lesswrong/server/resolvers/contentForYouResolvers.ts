import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { clearAiDigestRecommendationHistory } from "@/server/aiDigest/aiDigestHistory";
import { generateAiDigestPostSelection } from "@/server/aiDigest/aiDigestPostSelection";
import { createNotification } from "@/server/notificationCallbacksHelpers";

function assertContentForYouAccess(
  currentUser: DbUser | null,
): asserts currentUser is DbUser {
  if (!currentUser || !userIsAdmin(currentUser)) {
    throw new Error("Content for You is currently available only to admin accounts");
  }
}

export const contentForYouGraphQLMutations = {
  async GenerateContentForYouIssue(
    _root: void,
    { countsTowardHistory }: { countsTowardHistory?: boolean | null },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    assertContentForYouAccess(currentUser);

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

    return result.issueId;
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
  extend type Mutation {
    GenerateContentForYouIssue(
      countsTowardHistory: Boolean
    ): String!
    ClearContentForYouRecommendationHistory(days: Int!): Int!
  }
`;
