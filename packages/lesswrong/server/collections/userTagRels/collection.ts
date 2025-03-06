import { userCanUseTags } from "@/lib/betas";
import { createCollection } from '@/lib/vulcan-lib/collections';
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import schema from "@/lib/collections/userTagRels/schema";

export const UserTagRels: UserTagRelsCollection = createCollection({
  collectionName: 'UserTagRels',
  typeName: 'UserTagRel',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserTagRels', { tagId: 1, userId: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers('UserTagRels'),
  mutations: getDefaultMutations('UserTagRels', {
    newCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return userCanUseTags(user);
    },
    editCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return userCanUseTags(user);
    },
    removeCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return false;
    },
  }),
  logChanges: true,
});

UserTagRels.checkAccess = async (currentUser: DbUser|null, userTagRel: DbUserTagRel, context: ResolverContext|null): Promise<boolean> => {
  if (userIsAdmin(currentUser) || userOwns(currentUser, userTagRel)) { // admins can always see everything, users can always see their own settings
    return true;
  } else {
    return false;
  }
}

export default UserTagRels;
