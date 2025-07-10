import schema from '@/lib/collections/podcasts/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const Podcasts = createCollection({
  collectionName: 'Podcasts',
  typeName: 'Podcast',
  schema,
});


export default Podcasts;
