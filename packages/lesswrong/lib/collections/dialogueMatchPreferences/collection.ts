import { ensureIndex } from "../../collectionIndexUtils";
import { MutationOptions, getDefaultMutations } from "../../vulcan-core/default_mutations";
import { createCollection } from "../../vulcan-lib/collections";
import { userIsAdmin, userOwns } from "../../vulcan-users/permissions";
import DialogueChecks from "../dialogueChecks/collection";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

const options: MutationOptions<DbDialogueMatchPreference> = {
  newCheck: async (user: DbUser|null, document: DbDialogueMatchPreference|null) => {
    if (!user || !document) return false;
    const dialogueCheck = await DialogueChecks.findOne(document.dialogueCheckId);
    return !!dialogueCheck && userOwns(user, dialogueCheck);
  },

  editCheck: async (user: DbUser|null, document: DbDialogueMatchPreference|null) => {
    if (!user || !document) return false;
    const dialogueCheck = await DialogueChecks.findOne(document.dialogueCheckId);
    if (!dialogueCheck) return false;

    return userOwns(user, dialogueCheck) || userIsAdmin(user);
  },

  removeCheck: (user: DbUser|null, document: DbDialogueMatchPreference|null) => {
    // Nobody should be allowed to remove documents completely from the DB. 
    return false
  },
};

export const DialogueMatchPreferences: DialogueMatchPreferencesCollection = createCollection({
  collectionName: 'DialogueMatchPreferences',
  typeName: 'DialogueMatchPreference',
  schema,
  resolvers: getDefaultResolvers('DialogueMatchPreferences'),
  mutations: getDefaultMutations('DialogueMatchPreferences', options),
  logChanges: true,
});

DialogueMatchPreferences.checkAccess = async (user: DbUser|null, document: DbDialogueMatchPreference, context: ResolverContext|null): Promise<boolean> => {
  if (!user) {
    return false;
  }

  // Users can see their own preferences
  const dialogueCheck = context
    ? await context.loaders.DialogueChecks.load(document.dialogueCheckId)
    : await DialogueChecks.findOne(document.dialogueCheckId);
  
  if (dialogueCheck?.userId === user._id || dialogueCheck?.targetUserId === user._id) {
    return true;
  }

  return false;
};

addUniversalFields({ collection: DialogueMatchPreferences });

export default DialogueMatchPreferences;
