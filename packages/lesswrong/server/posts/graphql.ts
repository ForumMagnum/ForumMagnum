/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers } from '../vulcan-lib';

const specificResolvers = {
  Mutation: {
    increasePostViewCount(root: void, {postId}: {postId: string}, context: ResolverContext) {
      return context.Posts.rawUpdateOne({_id: postId}, { $inc: { viewCount: 1 }});
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('increasePostViewCount(postId: String): Float');
