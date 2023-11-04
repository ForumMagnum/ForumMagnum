import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import { randomId } from "../../lib/random";
import { augmentFieldsDict } from "../../lib/utils/schemaUtils";
import { defineMutation } from "../utils/serverGraphqlUtil";

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")
    const userId = currentUser._id
    const existingCheck = await DialogueChecks.findOne({targetUserId, userId}) //
    const recordId = existingCheck ? existingCheck._id : randomId() //
    
    const response = await repos.dialogueChecks.upsertDialogueCheck(recordId, currentUser._id, targetUserId, checked)
    //return response
    return {
      _id: recordId,
      userId: currentUser._id,
      targetUserId,
      checked,
    }
  } 
})

augmentFieldsDict(DialogueChecks, {
  match: {
    resolveAs: {
      fieldName: 'match',
      type: 'Boolean',
      resolver: async (check: DbDialogueCheck, args: void, context: ResolverContext): Promise<boolean> => {
        const currentUser = context.currentUser
        if (!currentUser) throw Error("Can't get match without current User")
        const matchedUsers = await context.repos.dialogueChecks.checkForMatch(check.userId, check.targetUserId);
        return matchedUsers.length > 0
      },
    }
  }
})
