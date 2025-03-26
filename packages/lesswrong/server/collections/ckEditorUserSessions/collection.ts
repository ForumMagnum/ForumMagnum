import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const CkEditorUserSessions = createCollection({
  collectionName: 'CkEditorUserSessions',
  typeName: 'CkEditorUserSession',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CkEditorUserSessions', { documentId: 1, userId: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('CkEditorUserSessions'),
  logChanges: true,
})


export default CkEditorUserSessions;
