import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { makeEditable } from "../../editor/make_editable";
import { userIsAdminOrMod } from '@/lib/vulcan-users';

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

makeEditable({
  collection: CurationNotices,
  options: {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }
})

CurationNotices.checkAccess = async (user) => {
  return userIsAdminOrMod(user);
};

export default CurationNotices;
