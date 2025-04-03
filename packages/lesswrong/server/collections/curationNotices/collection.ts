import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const CurationNotices: CurationNoticesCollection = createCollection({
  collectionName: 'CurationNotices',
  typeName: 'CurationNotice',
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

export default CurationNotices;
