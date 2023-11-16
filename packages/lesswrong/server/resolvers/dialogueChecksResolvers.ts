import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import { randomId } from "../../lib/random";
import { augmentFieldsDict } from "../../lib/utils/schemaUtils";
import { createNotifications } from "../notificationCallbacksHelpers";
import DialogueChecksRepo from "../repos/DialogueChecksRepo";
import { defineMutation } from "../utils/serverGraphqlUtil";

async function notifyUsersIfMatchingDialogueChecks (dialogueCheck: DbDialogueCheck) {
  const match = await getMatchingDialogueCheck(dialogueCheck);
  if (match) {
    await createNotifications({
      userIds: [dialogueCheck.userId],
      notificationType: "newDialogueMatch",
      documentType: "dialogueCheck",
      documentId: dialogueCheck._id,
    });
    await createNotifications({
      userIds: [match.userId],
      notificationType: "newDialogueMatch",
      documentType: "dialogueCheck",
      documentId: match._id,
    });
  }
}

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")    
    const response = await repos.dialogueChecks.upsertDialogueCheck(currentUser._id, targetUserId, checked)    
    void notifyUsersIfMatchingDialogueChecks(response)
    return response
  } 
})

export const getMatchingDialogueCheck = async (dialogueCheck : DbDialogueCheck) => {
  return await new DialogueChecksRepo().checkForMatch(dialogueCheck.userId, dialogueCheck.targetUserId) 
}

augmentFieldsDict(DialogueChecks, {
  match: {
    resolveAs: {
      fieldName: 'match',
      type: 'Boolean',
      resolver: async (check: DbDialogueCheck, args: void, context: ResolverContext): Promise<boolean> => {
        const currentUser = context.currentUser
        if (!currentUser) throw Error("Can't get match without current User")
        const match = await getMatchingDialogueCheck(check)
        return !!match
      },
    }
  }
})
