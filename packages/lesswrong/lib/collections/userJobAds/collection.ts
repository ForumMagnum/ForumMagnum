import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserJobAds: UserJobAdsCollection = createCollection({
  collectionName: 'UserJobAds',
  typeName: 'UserJobAd',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserJobAds', {userId: 1, jobName: 1}, {unique: true});
    indexSet.addIndex('UserJobAds', { userId: 1 })

    // for userJobAdCron.tsx
    indexSet.addIndex('UserJobAds', { jobName: 1, adState: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('UserJobAds'),
  mutations: getDefaultMutations('UserJobAds'),
  logChanges: true,
});

export default UserJobAds;
