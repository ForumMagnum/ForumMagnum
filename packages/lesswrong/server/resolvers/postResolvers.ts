import { Posts } from '../../lib/collections/posts/collection';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { getDefaultPostLocationFields } from '../posts/utils'
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../vulcan-lib';

augmentFieldsDict(Posts, {
  // Compute a denormalized start/end time for events, accounting for the
  // timezone the event's location is in. This is subtly wrong: it computes a
  // correct timestamp, but then the timezone part of that timezone gets lost
  // on the way in/out of the database, so if you use this field, what you're
  // getting is "local time mislabeled as UTC".
  localStartTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('startTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.startTime) return null
        const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.startTime, googleLocation)
      }
    })
  },
  localEndTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('endTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.endTime) return null
        const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.endTime, googleLocation)
      }
    })
  },
})

addGraphQLResolvers({
  Query: {
    async GetReviewList(
      _root: void,
      {year, limit}: {year?: number, limit?: number},
      context: ResolverContext
    ) {
      const { currentUser } = context
      const yearUsed = year || REVIEW_YEAR
      const limitUsed = limit || 100
      
      try {
        console.log('1')
        const postCursor = await Posts.find({
          positiveReviewVoteCount: {$gt: 0},
        }, /* {
          projection: {contents: 0}
        } */)
        console.log('2')
        const posts = await postCursor.fetch()
        console.log('3')
        return posts
        // How the eff is there a resolver running after this?
      } catch (error) {
        console.error(error)
        return []
      }
    }
  },
})

// addGraphQLSchema(`
//   type ReviewListPost {
//     _id: String
//     title: String
//   }
// `)

addGraphQLQuery("GetReviewList(year: Int, limit: Int): [Post!]")
