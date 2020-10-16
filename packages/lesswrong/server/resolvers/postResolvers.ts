import { Posts } from '../../lib/collections/posts/collection';
import { Users } from '../../lib/collections/users/collection';
import { addFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { getDefaultPostLocationFields } from '../posts/utils'
import { loadRevision } from '../revisionsCache';

addFieldsDict(Posts, {
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
        const googleLocation = post.googleLocation || getDefaultPostLocationFields(post).googleLocation
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
        const googleLocation = post.googleLocation || getDefaultPostLocationFields(post).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.endTime, googleLocation)
      }
    })
  },
  
  showModerationGuidelines: {
    resolveAs: {
      type: 'Boolean',
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<boolean> => {
        const { LWEvents, currentUser } = context;
        if(currentUser){
          const query = {
            name:'toggled-user-moderation-guidelines',
            documentId: post.userId,
            userId: currentUser._id
          }
          const sort = {sort:{createdAt:-1}}
          const event = await LWEvents.findOne(query, sort);
          const author = await Users.findOne({_id: post.userId});
          if (event) {
            return !!(event.properties && event.properties.targetState)
          } else {
            if (author?.collapseModerationGuidelines) {
              return false;
            } else {
              const moderationGuidelines = await loadRevision({
                collection: Posts, doc: post,
                fieldName: "moderationGuidelines"
              });
              return !!(moderationGuidelines?.html || post.moderationStyle)
            }
          }
        } else {
          return false
        }
      },
      addOriginalField: false
    }
  },
  
  // DEPRECATED field for GreaterWrong backwards compatibility
  wordCount: {
    type: Number,
    resolveAs: {
      type: "Int",
      resolver: async (doc: DbPost, args: void, context: ResolverContext): Promise<number> => {
        const rev = await loadRevision({
          doc,
          collection: Posts,
          fieldName: "contents",
        });
        if (!rev) return 0;
        return rev.wordCount;
      },
    },
  },
  // DEPRECATED field for GreaterWrong backwards compatibility
  htmlBody: {
    type: String,
    resolveAs: {
      type: "String",
      resolver: async (doc: DbPost, args: void, { Posts }: ResolverContext): Promise<string> => {
        const rev = await loadRevision({
          doc,
          collection: Posts,
          fieldName: "contents",
        });
        if (!rev) return "";
        return rev.html;
      }
    },
  },
})
