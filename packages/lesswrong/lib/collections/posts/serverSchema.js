import { Posts } from './collection';
import { addFieldsDict, denormalizedField } from '../../modules/utils/schemaUtils'
import { getLocalTime } from '../../../server/mapsUtils'

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
        if (!post.googleLocation || !post.startTime) return null
        return await getLocalTime(post.startTime, post.googleLocation)
      }
    })
  },
  localEndTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('endTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.googleLocation || !post.endTime) return null
        return await getLocalTime(post.endTime, post.googleLocation)
      }
    })
  },
})
