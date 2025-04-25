import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const AdvisorRequests: AdvisorRequestsCollection = createCollection({
  collectionName: 'AdvisorRequests',
  typeName: 'AdvisorRequest',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('AdvisorRequests', { userId: 1 })
    return indexSet;
  },
});


export default AdvisorRequests;
