import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils';

export const PodcastEpisodes: PodcastEpisodesCollection = createCollection({
  collectionName: 'PodcastEpisodes',
  typeName: 'PodcastEpisode',
  schema,
  resolvers: getDefaultResolvers('PodcastEpisodes')
});

addUniversalFields({ collection: PodcastEpisodes });

export default PodcastEpisodes;