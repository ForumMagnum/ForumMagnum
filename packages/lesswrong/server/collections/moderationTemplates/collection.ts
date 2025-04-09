import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ModerationTemplates: ModerationTemplatesCollection = createCollection({
  collectionName: 'ModerationTemplates',
  typeName: 'ModerationTemplate',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModerationTemplates', { deleted: 1, order: 1 })
    indexSet.addIndex('ModerationTemplates', { collectionName: 1, deleted: 1, order: 1 })
    return indexSet;
  },
  logChanges: true,
});


export default ModerationTemplates;
