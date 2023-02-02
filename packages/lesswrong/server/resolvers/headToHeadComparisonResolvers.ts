import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { isValidCollectionName } from '../../lib/vulcan-lib/getCollection';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils'
import { defineQuery } from '../utils/serverGraphqlUtil';
import { getRecommendedPosts } from '../recommendations/recommendations';
import { Posts } from '../../lib/collections/posts/collection';

defineQuery({
  name: "headToHeadPostComparison",
  schema: `
    type HeadToHeadPostComparison {
      firstPost: Post
      secondPost: Post
    }
  `,
  resultType: "HeadToHeadPostComparison",
  fn: async (root: void, args: {}, context: ResolverContext): Promise<{
    firstPost: DbPost,
    secondPost: DbPost,
  }> => {
    const { currentUser } = context;
    if (!currentUser) throw new Error("Must be logged in");
    
    // Get two different randomly selected posts that are both marked as read
    const posts = await getRecommendedPosts({
      currentUser, count: 2,
      algorithm: {
        method: "sample",
        scoreOffset: 100,
        scoreExponent: 0,
        onlyRead: true,
        includePersonal: true,
        excludeDefaultRecommendations: true,
      }
    });
    
    const accessFilteredPosts = await accessFilterMultiple(currentUser, Posts, posts, context);
    const [firstPost,secondPost] = accessFilteredPosts;
    
    return {firstPost, secondPost} as any;
  }
});
