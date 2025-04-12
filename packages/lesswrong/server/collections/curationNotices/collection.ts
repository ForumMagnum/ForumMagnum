import { createCollection } from '@/lib/vulcan-lib/collections';

export const CurationNotices: CurationNoticesCollection = createCollection({
  collectionName: 'CurationNotices',
  typeName: 'CurationNotice',
});

export default CurationNotices;
