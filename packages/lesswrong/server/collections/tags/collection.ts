import schema from '@/lib/collections/tags/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  schema,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export default Tags;
