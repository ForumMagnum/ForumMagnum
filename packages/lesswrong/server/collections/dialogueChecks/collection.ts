import { createCollection } from "@/lib/vulcan-lib/collections";
import schema from "@/lib/collections/dialogueChecks/schema";
import { addUniversalFields } from "@/lib/collectionUtils";
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

DialogueChecks.checkAccess = async (user: DbUser|null, document: DbDialogueCheck, context: ResolverContext|null): Promise<boolean> => {
  // Case 1: A user can see their own checks
  if (document.userId === user?._id) {
    return true;
  }

  // Case 2: A user can see the checks of people they themselves have checked... 
  const outgoingCheck = await DialogueChecks.findOne({ userId: user?._id, targetUserId: document.userId, checked: true });
  // ...but only the checks concerning themselves
  const targetOfOtherCheck = (document.targetUserId === user?._id)
  if (outgoingCheck && targetOfOtherCheck) {
    return true;
  }

  // If none of the above conditions are met, deny access
  return false;
};

addUniversalFields({ collection: DialogueChecks })

export default DialogueChecks;
