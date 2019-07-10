/*

GraphQL config

*/
import { addGraphQLMutation, addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core'
import { Posts } from '../../lib/collections/posts';

const specificResolvers = {
  Mutation: {
    increasePostViewCount(root, { postId }, context) {
      return context.Posts.update({_id: postId}, { $inc: { viewCount: 1 }})
    }
  }
}

addGraphQLResolvers(specificResolvers)
addGraphQLMutation('increasePostViewCount(postId: String): Float')

const postsByTimeframeAggregationPipeline = {

}

addGraphQLResolvers({
  Query: {
    async PostsByTimeframe(root, args, context) {
      console.log('hit posts by timeframe')
      const results = await Posts.aggregate(postsByTimeframeAggregationPipeline)
      return results
    }
  }
})

addGraphQLQuery("PostsByTimeframe(foo: Int): [Post!]") // TODO; args

