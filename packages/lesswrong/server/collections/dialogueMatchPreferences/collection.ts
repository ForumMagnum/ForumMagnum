import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const DialogueMatchPreferences: DialogueMatchPreferencesCollection = createCollection({
  collectionName: 'DialogueMatchPreferences',
  typeName: 'DialogueMatchPreference',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DialogueMatchPreferences', { dialogueCheckId: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('DialogueMatchPreferences'),
  logChanges: true,
});

export default DialogueMatchPreferences;
