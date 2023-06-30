import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from '../../collectionUtils'
import { userOwns } from '../../vulcan-users';

export const UserLists = createCollection({
  collectionName: 'UserLists',
  typeName: 'UserList',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('UserLists'),
  logChanges: true,
  mutations: getDefaultMutations('UserLists'),  
})

makeEditable({
  collection: UserLists,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    fieldName: "description",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userOwns],
      canCreate: ['members'],
    }
  }
})

UserLists.checkAccess = async (currentUser: DbUser|null, userList: DbUserList, context: ResolverContext|null, outReasonDenied: {reason?: string}): Promise<boolean> => {
  const isOwner = !!(currentUser && currentUser._id===userList.userId);
  if (!isOwner && !userList.isPublic) {
    return false
  }
  if (userList.deleted) {
    return false;
  }

  return true;
}

addUniversalFields({collection: UserLists})

export default UserLists;
