import { createCollection } from "@/lib/vulcan-lib/collections";
import schema from "@/lib/collections/dialogueChecks/schema";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const DialogueChecks: DialogueChecksCollection = createCollection({
  collectionName: 'DialogueChecks',
  typeName: 'DialogueCheck',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DialogueChecks', { userId: 1, targetUserId: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers('DialogueChecks'),
  logChanges: true,
})

export default DialogueChecks;
