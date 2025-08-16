import schema from '@/lib/collections/podcastEpisodes/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const PodcastEpisodes = createCollection({
  collectionName: 'PodcastEpisodes',
  typeName: 'PodcastEpisode',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PodcastEpisodes', { externalEpisodeId: 1 }, { unique: true });
    return indexSet;
  },
});


export default PodcastEpisodes;
