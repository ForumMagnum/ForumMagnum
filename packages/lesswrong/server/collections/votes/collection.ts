import schema from '@/lib/collections/votes/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const Votes = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
});

export default Votes;
