import { Posts } from './collection';
import { addFieldsDict, denormalizedField } from '../../modules/utils/schemaUtils'
import { getLocalTime } from '../../../server/mapsUtils'

addFieldsDict(Posts, {
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