import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import Sequences from '../sequences/collection';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Chapters: ChaptersCollection = createCollection({
  collectionName: 'Chapters',
  typeName: 'Chapter',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Chapters', { sequenceId: 1, number: 1 })
    return indexSet;
  },
})

export default Chapters;
