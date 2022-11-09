import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils';
import { userIsAdmin, userIsPodcaster } from '../../vulcan-users';

export const PodcastEpisodes: PodcastEpisodesCollection = createCollection({
  collectionName: 'PodcastEpisodes',
  typeName: 'PodcastEpisode',
  schema,
  resolvers: getDefaultResolvers('PodcastEpisodes'),
  mutations: getDefaultMutations('PodcastEpisodes', {
    newCheck(user) {
      return userIsAdmin(user) || userIsPodcaster(user);
    },
    editCheck(user) {
      return userIsAdmin(user) || userIsPodcaster(user);
    },
  })
});

addUniversalFields({ collection: PodcastEpisodes });

export default PodcastEpisodes;
