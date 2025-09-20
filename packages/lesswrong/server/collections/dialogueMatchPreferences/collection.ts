import schema from '@/lib/collections/dialogueMatchPreferences/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const DialogueMatchPreferences = createCollection({
  collectionName: 'DialogueMatchPreferences',
  typeName: 'DialogueMatchPreference',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DialogueMatchPreferences', { dialogueCheckId: 1 });
    return indexSet;
  },
});

export default DialogueMatchPreferences;
