import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const PodcastEpisodes: PodcastEpisodesCollection = createCollection({
  collectionName: 'PodcastEpisodes',
  typeName: 'PodcastEpisode',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PodcastEpisodes', { externalEpisodeId: 1 }, { unique: true });
    return indexSet;
  },
});


export default PodcastEpisodes;
