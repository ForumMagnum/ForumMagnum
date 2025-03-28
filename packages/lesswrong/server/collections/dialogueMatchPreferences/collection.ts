import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import DialogueChecks from "../dialogueChecks/collection";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

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
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DialogueMatchPreferences', { dialogueCheckId: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('DialogueMatchPreferences'),
  mutations: getDefaultMutations('DialogueMatchPreferences', options),
  logChanges: true,
});

export default DialogueMatchPreferences;
