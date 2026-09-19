import schema from '@/lib/collections/chapters/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Chapters = createCollection({
  collectionName: 'Chapters',
  typeName: 'Chapter',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Chapters', { sequenceId: 1, number: 1 });
    // Post search updates use array containment to find affected sequences.
    indexSet.addCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_post_ids ON "Chapters" USING gin("postIds");`);
    return indexSet;
  },
});

export default Chapters;
