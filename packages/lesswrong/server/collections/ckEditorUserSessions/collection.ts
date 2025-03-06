import { createCollection } from "@/lib/vulcan-lib/collections";
import schema from "@/lib/collections/ckEditorUserSessions/schema";
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
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
  resolvers: getDefaultResolvers('CkEditorUserSessions'),
  logChanges: true,
})

addUniversalFields({ collection: CkEditorUserSessions })

export default CkEditorUserSessions;
