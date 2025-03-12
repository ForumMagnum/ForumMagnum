import { userCanUseTags } from "@/lib/betas";
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
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

export default UserTagRels;
