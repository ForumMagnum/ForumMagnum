import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const CurationNotices: CurationNoticesCollection = createCollection({
  collectionName: 'CurationNotices',
  typeName: 'CurationNotice',
  schema,
  resolvers: getDefaultResolvers('CurationNotices'),
  mutations: getDefaultMutations('CurationNotices', {
    newCheck: (user, document) => {
      return userIsAdminOrMod(user)
    },
    editCheck: (user, document) => {
      return userIsAdminOrMod(user)
    },
    removeCheck: (user, document) => {
      return false
    }
  }),
  logChanges: true,
});

addUniversalFields({collection: CurationNotices});

CurationNotices.checkAccess = async (user) => {
  return userIsAdminOrMod(user);
};

export default CurationNotices;
