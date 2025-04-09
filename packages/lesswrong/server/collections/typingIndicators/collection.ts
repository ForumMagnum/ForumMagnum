import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const TypingIndicators: TypingIndicatorsCollection = createCollection({
  collectionName: 'TypingIndicators',
  typeName: 'TypingIndicator',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TypingIndicators', { documentId: 1, userId: 1 }, { unique: true });
    return indexSet;
  },
  logChanges: true,
})

export default TypingIndicators;
