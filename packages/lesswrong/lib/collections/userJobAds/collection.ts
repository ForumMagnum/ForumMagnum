import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const UserJobAds: UserJobAdsCollection = createCollection({
  collectionName: 'UserJobAds',
  typeName: 'UserJobAd',
  schema,
  resolvers: getDefaultResolvers('UserJobAds'),
  mutations: getDefaultMutations('UserJobAds'),
  logChanges: true,
});

addUniversalFields({collection: UserJobAds})

export default UserJobAds;
