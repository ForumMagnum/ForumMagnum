/*

GraphQL config

*/

import gql from 'graphql-tag';

export const extraPostResolversGraphQLTypeDefs = gql`
  extend type Mutation {
    increasePostViewCount(postId: String): Float
  }
`

export const extraPostResolversGraphQLMutations = {
  increasePostViewCount(root: void, {postId}: {postId: string}, context: ResolverContext) {
    return context.Posts.rawUpdateOne({_id: postId}, { $inc: { viewCount: 1 }});
  }
}