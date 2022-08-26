import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils';

export const Podcasts: PodcastsCollection = createCollection({
  collectionName: 'Podcasts',
  typeName: 'Podcast',
  schema,
  resolvers: getDefaultResolvers('Podcasts')
});

addUniversalFields({ collection: Podcasts });

export default Podcasts;
