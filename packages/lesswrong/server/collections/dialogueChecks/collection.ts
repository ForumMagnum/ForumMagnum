import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const DialogueChecks = createCollection({
  collectionName: 'DialogueChecks',
  typeName: 'DialogueCheck',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DialogueChecks', { userId: 1, targetUserId: 1 }, { unique: true });
    return indexSet;
  },
})

export default DialogueChecks;
