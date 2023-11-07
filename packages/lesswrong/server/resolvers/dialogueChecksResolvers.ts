import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import { randomId } from "../../lib/random";
import { augmentFieldsDict } from "../../lib/utils/schemaUtils";
import DialogueChecksRepo from "../repos/DialogueChecksRepo";
import { defineMutation } from "../utils/serverGraphqlUtil";

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")    
    const response = await repos.dialogueChecks.upsertDialogueCheck(currentUser._id, targetUserId, checked)
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
