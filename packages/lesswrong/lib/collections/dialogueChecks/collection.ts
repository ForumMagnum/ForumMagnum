import {ensureIndex} from "../../collectionIndexUtils";
import {addUniversalFields, getDefaultMutations, getDefaultResolvers, schemaDefaultValue} from "../../collectionUtils";
import {createCollection} from "../../vulcan-lib";
import schema from "./schema";

export const DialogueChecks: DialogueChecksCollection = createCollection({
  collectionName: 'DialogueChecks',
  typeName: 'DialogueCheck',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('DialogueChecks'),
  logChanges: true,
})


// TODO!!!: 
DialogueChecks.checkAccess = async (user: DbUser|null, document: DbDialogueCheck, context: ResolverContext|null): Promise<boolean> => {
  // You can only access ones that belong to you
  return document.userId === user?._id;
};

addUniversalFields({ collection: DialogueChecks })
ensureIndex(DialogueChecks, { userId: 1, targetUserId: 1 }, { unique: true });

export default DialogueChecks;
