import { defineMutation } from '../utils/serverGraphqlUtil';
import { UserPostEngagements } from '../../lib/collections/userPostEngagements/collection';
import { RecommendationLogs } from '../../lib/collections/recommendationLogs/collection';
import { createMutator } from '../vulcan-lib';

defineMutation({
  name: "recordImpression",
  resultType: "Boolean!",
  argTypes: "(recommendationId: String!)",
  fn: async (root: any, {recommendationId}: {recommendationId: string}, context: ResolverContext): Promise<boolean> => {
    // TODO
    return true;
  },
});

defineMutation({
  name: "recordClickthrough",
  resultType: "Boolean!",
  argTypes: "(recommendationId: String!)",
  fn: async (root: any, {recommendationId}: {recommendationId: string}, context: ResolverContext): Promise<boolean> => {
    const recommendation = await RecommendationLogs.findOne({_id: recommendationId});
    if (!recommendation) {
      throw new Error("Invalid recommendation ID");
    }
    const existingEngagement = await UserPostEngagements.findOne({postId: recommendation.postId, userId: context.currentUser?._id}); // TODO logged out case
    if (existingEngagement) {
      return true
    }
    await createMutator({
      collection: UserPostEngagements,
      document: {
        postId: recommendation.postId,
        userId: context.currentUser?._id,
        clientId: null, // TODO
        referralType: "recommendation",
        referralRecommendation: recommendationId,
      },
    })
    return true;
  },
});

defineMutation({
  name: "recordReadingTime",
  resultType: "Boolean!",
  argTypes: "(postId: String!, timeSpentMS: Int!)",
  fn: async (root: any, {postId,timeSpentMS}: {postId: string, timeSpentMS: number}, context: ResolverContext): Promise<boolean> => {
    const { currentUser } = context;
    if (!currentUser) {
      // TODO: If not logged in, use clientId
      return true;
    }
    const clientId = ""; //TODO
    const userId = currentUser._id;
    
    await ensureEngagementExists({ userId, clientId, postId });
    await UserPostEngagements.rawUpdateOne(
      {postId, userId},
      {$inc: {readingTimeMS: timeSpentMS}},
    );
    
    return true;
  }
});

/**
 * Ensure an entry exists in the UserPostEngagements collection for a user-post
 * pair, so that it can be updated to record something happening. Returns its
 * ID.
 *
 * Ordinarily this should already exist and be a no-op. If it doesn't exist,
 * it's presumed to be direct traffic (not attributed to any recommendation).
 * 
 */
async function ensureEngagementExists({userId, clientId, postId}: {userId: string, clientId: string, postId: string}) {
  const existingEngagement = await UserPostEngagements.findOne({
    userId, postId,
  });
  if (!existingEngagement) {
    await createMutator({
      collection: UserPostEngagements,
      document: {
        postId, userId, clientId,
        referralType: "unknown",
        referralRecommendation: undefined,
      },
    })
  }
}
