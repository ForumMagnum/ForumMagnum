import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { ensureIndex } from '../../collectionIndexUtils';

export const UserJobAds: UserJobAdsCollection = createCollection({
  collectionName: 'UserJobAds',
  typeName: 'UserJobAd',
  schema,
  resolvers: getDefaultResolvers('UserJobAds'),
  mutations: getDefaultMutations('UserJobAds'),
  logChanges: true,
});

ensureIndex(UserJobAds, {userId: 1, jobName: 1}, {unique: true});
addUniversalFields({collection: UserJobAds})

export default UserJobAds;
