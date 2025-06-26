import { createCollection } from '@/lib/vulcan-lib/collections';
import { userCanDo, userOwns } from '@/lib/vulcan-users/permissions';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


function augmentForDefaultView(indexFields: MongoIndexKeyObj<DbSequence>): MongoIndexKeyObj<DbSequence> {
  return { hidden:1, af:1, isDeleted:1, ...indexFields };
}

export const Sequences = createCollection({
  collectionName: 'Sequences',
  typeName: 'Sequence',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Sequences', augmentForDefaultView({ userId:1, userProfileOrder: -1 }));
    indexSet.addIndex('Sequences', augmentForDefaultView({ userId: 1, draft: 1, hideFromAuthorPage: 1, userProfileOrder: 1 }))
    indexSet.addIndex('Sequences', augmentForDefaultView({ curatedOrder:-1 }));
    return indexSet;
  },
})

export default Sequences;
