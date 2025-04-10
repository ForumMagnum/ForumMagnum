import { createCollection } from '@/lib/vulcan-lib/collections';

export const Podcasts: PodcastsCollection = createCollection({
  collectionName: 'Podcasts',
  typeName: 'Podcast',
});


export default Podcasts;
