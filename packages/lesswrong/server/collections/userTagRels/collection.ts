import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const UserTagRels: UserTagRelsCollection = createCollection({
  collectionName: 'UserTagRels',
  typeName: 'UserTagRel',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserTagRels', { tagId: 1, userId: 1 }, { unique: true });
    return indexSet;
  },
});

export default UserTagRels;
