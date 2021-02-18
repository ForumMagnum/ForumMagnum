/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers } from '../vulcan-lib';

const specificResolvers = {
  Mutation: {
    // EXERCISE4d: Fill in type annotations for this function
    increasePostViewCount(root, {postId}, context) {
      return context.Posts.update({_id: postId}, { $inc: { viewCount: 1 }});
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('increasePostViewCount(postId: String): Float');



