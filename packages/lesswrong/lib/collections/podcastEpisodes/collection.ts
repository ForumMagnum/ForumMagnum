import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { userIsAdmin, userIsPodcaster } from '../../vulcan-users/permissions';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const PodcastEpisodes: PodcastEpisodesCollection = createCollection({
  collectionName: 'PodcastEpisodes',
  typeName: 'PodcastEpisode',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PodcastEpisodes', { externalEpisodeId: 1 }, { unique: true });
    return indexSet;
  },
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

export default PodcastEpisodes;
