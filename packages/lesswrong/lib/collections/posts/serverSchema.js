import { Posts } from './collection';
import { addFieldsDict, denormalizedField } from '../../modules/utils/schemaUtils'
import { getLocalTime } from '../../../server/mapsUtils'
import GraphQLJSON from 'graphql-type-json';

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
  tableOfContents: {
    type: Object,
    resolveAs: {
      fieldName: "tableOfContents",
      type: GraphQLJSON,
      resolver: async (document, args, { Revisions }) => {
        const latestRevId = document.contents_latest;
        if (!latestRevId) return null;
        const latestRev = await Revisions.loader.load(latestRevId);
        return await Utils.getTableOfContentsData(document, latestRev);
      },
    },
  },
})