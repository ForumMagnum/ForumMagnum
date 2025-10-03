import schema from '@/lib/collections/curationNotices/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const CurationNotices = createCollection({
  collectionName: 'CurationNotices',
  typeName: 'CurationNotice',
  schema,
});

export default CurationNotices;
