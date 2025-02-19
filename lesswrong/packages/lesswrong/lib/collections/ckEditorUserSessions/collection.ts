import { ensureIndex } from "../../collectionIndexUtils";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib";
import schema from "./schema";

export const CkEditorUserSessions = createCollection({
  collectionName: 'CkEditorUserSessions',
  typeName: 'CkEditorUserSession',
  schema,
  resolvers: getDefaultResolvers('CkEditorUserSessions'),
  logChanges: true,
})

addUniversalFields({ collection: CkEditorUserSessions })

ensureIndex(CkEditorUserSessions, {documentId: 1, userId: 1})

export default CkEditorUserSessions;
