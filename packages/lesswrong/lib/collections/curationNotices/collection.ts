import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
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

CurationNotices.checkAccess = async (user) => {
  return userIsAdminOrMod(user);
};

export default CurationNotices;
