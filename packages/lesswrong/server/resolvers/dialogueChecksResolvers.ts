import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import { augmentFieldsDict } from "../../lib/utils/schemaUtils";
import { createNotifications } from "../notificationCallbacksHelpers";
import DialogueChecksRepo from "../repos/DialogueChecksRepo";
import { defineMutation } from "../utils/serverGraphqlUtil";

async function notifyUsersMatchingDialogueChecks (dialogueCheck: DbDialogueCheck, matchingDialogueCheck: DbDialogueCheck) {
  await Promise.all([ 
    createNotifications({
      userIds: [dialogueCheck.userId],
      notificationType: "newDialogueMatch",
      documentType: "dialogueCheck",
      documentId: dialogueCheck._id,
    }),
    createNotifications({
      userIds: [matchingDialogueCheck.userId],
      notificationType: "newDialogueMatch",
      documentType: "dialogueCheck",
      documentId: matchingDialogueCheck._id,
    })
  ])
}

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")    
    const dialogueCheck = await repos.dialogueChecks.upsertDialogueCheck(currentUser._id, targetUserId, checked) 
    const matchingDialogueCheck = await getMatchingDialogueCheck(dialogueCheck)
    if (matchingDialogueCheck) {
      void notifyUsersMatchingDialogueChecks(dialogueCheck, matchingDialogueCheck)   
    }
    return dialogueCheck
  } 
})

defineMutation({
  name: "upsertCheckHideInRecommendations",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, hideInRecommendations: Boolean!)",
  fn: async (_, {targetUserId, hideInRecommendations}:{targetUserId:string, hideInRecommendations:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")    
    const dialogueCheck = await repos.dialogueChecks.upsertDialogueHideInRecommendations(currentUser._id, targetUserId, hideInRecommendations) 
    return dialogueCheck
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
      resolver: async (dialogueCheck: DbDialogueCheck, args: void, context: ResolverContext): Promise<boolean> => {
        const currentUser = context.currentUser
        if (!currentUser) throw Error("Can't get match without current User")
        const matchingDialogueCheck = await getMatchingDialogueCheck(dialogueCheck)
        return !!matchingDialogueCheck
      },
    }
  }
})
