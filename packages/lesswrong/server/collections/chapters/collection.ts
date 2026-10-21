import schema from '@/lib/collections/chapters/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Chapters = createCollection({
  collectionName: 'Chapters',
  typeName: 'Chapter',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Chapters', { sequenceId: 1, number: 1 })
    return indexSet;
  },
})

export default Chapters;
