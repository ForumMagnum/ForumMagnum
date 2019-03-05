import { Posts } from './collection';
import { addFieldsDict } from '../../modules/utils/schemaUtils'
import { getLocalTime } from '../../../server/mapsUtils'

addFieldsDict(Posts, {
  localStartTime: {
    resolveAs: {
      type: 'Date',
      resolver: async (post) => {
        if (!post.startTime || !post.googleLocation) return null
        return await getLocalTime(post.startTime, post.googleLocation)
      }
    }
  },
  localEndTime: {
    resolveAs: {
      type: 'Date',
      resolver: async (post) => {
        if (!post.endTime || !post.googleLocation) return null
        return await getLocalTime(post.endTime, post.googleLocation)
      }
    }
  },
})