import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserJobAds: UserJobAdsCollection = createCollection({
  collectionName: 'UserJobAds',
  typeName: 'UserJobAd',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserJobAds', {userId: 1, jobName: 1}, {unique: true});
    indexSet.addIndex('UserJobAds', { userId: 1 })

    // for userJobAdCron.tsx
    indexSet.addIndex('UserJobAds', { jobName: 1, adState: 1 });
    return indexSet;
  },
});


export default UserJobAds;
