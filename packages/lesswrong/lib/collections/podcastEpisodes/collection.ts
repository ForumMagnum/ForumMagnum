import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils';

export const PodcastEpisodes: PodcastEpisodesCollection = createCollection({
  collectionName: 'PodcastEpisodes',
  typeName: 'PodcastEpisode',
  schema,
  resolvers: getDefaultResolvers('PodcastEpisodes'),
  mutations: getDefaultMutations('PodcastEpisodes')
});

addUniversalFields({ collection: PodcastEpisodes });

export default PodcastEpisodes;
