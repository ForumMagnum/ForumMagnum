import { PostRelations } from '../../lib/collections/postRelations';
import { Posts } from '../../lib/collections/posts/collection';
import { PostRelationsRepo } from '../repos';
import { accessFilterMultiple, augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { getDefaultPostLocationFields } from '../posts/utils'

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
  targetPostRelations: {
    resolveAs: {
      type: '[PostRelation!]!',
      resolver: async (post: DbPost, _args: void, context: ResolverContext) => {
        const { Posts, currentUser } = context;
        let postRelations: DbPostRelation[] = [];
        if (Posts.isPostgres()) {
          const repo = PostRelationsRepo.resolve();
          postRelations = await repo.getPostRelationsByPostId(post._id);
        } else {
          postRelations = await Posts.aggregate([
            { $match: { _id: post._id }},
            { $graphLookup: {
              from: "postrelations",
              as: "relatedQuestions",
              startWith: post._id,
              connectFromField: "targetPostId",
              connectToField: "sourcePostId",
              maxDepth: 3
            }
            },
            {
              $project: {
                relatedQuestions: 1
              }
            },
            {
              $unwind: "$relatedQuestions"
            },
            {
              $replaceRoot: {
                newRoot: "$relatedQuestions"
              }
            }
          ]).toArray()
        }
       if (!postRelations || postRelations.length < 1) return []
       return await accessFilterMultiple(currentUser, PostRelations, postRelations, context);
      }
    },
  },
})
