import { ensureIndex } from "../../collectionIndexUtils";
import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
