import schema from '@/lib/collections/ckEditorUserSessions/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const CkEditorUserSessions = createCollection({
  collectionName: 'CkEditorUserSessions',
  typeName: 'CkEditorUserSession',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CkEditorUserSessions', { documentId: 1, userId: 1 })
    return indexSet;
  },
})


export default CkEditorUserSessions;
