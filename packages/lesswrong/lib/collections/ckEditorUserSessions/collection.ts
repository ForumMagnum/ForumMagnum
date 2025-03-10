import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

export default CkEditorUserSessions;
