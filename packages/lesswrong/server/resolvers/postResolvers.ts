import { Posts } from '../../lib/collections/posts/collection';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { Utils } from '../../lib/vulcan-lib/utils';
import { getDefaultPostLocationFields } from '../posts/utils'
import { addBlockIDsToHTML, getPostBlockCommentLists } from '../sideComments';

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
  sideComments: {
    type: "JSON",
    resolveAs: {
      type: "JSON",
      resolver: async (post, args: void, context: ResolverContext) => {
        const toc = await Utils.getToCforPost({document: post, version: null, context});
        const html = toc?.html || post?.contents?.html
        return {
          html: addBlockIDsToHTML(html),
          commentsByBlock: await getPostBlockCommentLists(context, post),
        };
      }
    },
  },
})
