/*

GraphQL config

*/
import { addGraphQLMutation, addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from 'meteor/vulcan:core'
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

// TODO; Remove if unused - Single query was a fun idea, but I don't think it's
// complexity is justified
// // TODO; doc
// // Thanks StackOverflow + Micki
// // https://stackoverflow.com/questions/56960040/top-documents-per-bucket
// // TODO;       ...Posts.getParameters({}).selector,
const makeTimeframePipeline = ({foo}) => {
  //
  return [
    {$bucket: {
      groupBy: "$postedAt",
      boundaries: [
        // TODO; slimed
        new Date('2019-06-01'),
        new Date('2019-07-01'),
        new Date('2019-08-01')
      ],
      default: "Other",
      output: {
        posts: {
          $push: {
            _id: "$_id",
            baseScore: '$baseScore', // TODO; parametrize
            title: '$title'
          }
        }
      }
    }},
    {$match: {_id: {$ne: "Other"}}},
    {$unwind: "$posts"},
    {$sort: {"posts.baseScore": -1}},
    {$group: {
      _id: "$_id", // TODO; rename
      posts: {$push: {
        _id: "$posts._id",
        baseScore: "$posts.baseScore",
        title: "$posts.title"
      }}
    }},
    {$project: {_id: 1, posts: {$slice: ["$posts", 2]}}}
  ]
}
// const pipeline = makeTimeframePipeline(args)

// TODO; maybe multiple queries
// // TODO; ...Posts.getParameters({}).selector,
// const result = await Promise.all([
//   Posts.find(
//     {postedAt: {$gte: Date('2019-06-01'), $lt: new Date('2019-07-01')}},
//     {sort: {baseScore: -1}, limit: 2}
//   ),
//   //           new Date('2019-06-01'),
//   //           new Date('2019-07-01'),
//   //           new Date('2019-08-01')
// ])

addGraphQLResolvers({
  Query: {
    async PostsByTimeframe(root, args, context) {
      console.log('hit posts by timeframe')
      // console.log(' root', root)
      console.log(' args', args)
      // console.log(' context', Object.keys(context))
      const pipeline = makeTimeframePipeline(args)
      const results = await Posts.aggregate(pipeline).toArray()
      console.log('results', results)
      return results
    }
  }
})


addGraphQLSchema(`
  type PostsByTimeframeBucket {
    _id: String
    posts: [Post]
  }
`)

// TODO; change return sig
addGraphQLQuery("PostsByTimeframe(foo: Int): [PostsByTimeframeBucket!]") // TODO; args

