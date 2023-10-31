//import { isDialogueParticipant } from "../../components/posts/PostsPage/PostsPage";
import DialogueChecks from "../../lib/collections/dialogueChecks/collection";
import { randomId } from "../../lib/random";
import { augmentFieldsDict } from "../../lib/utils/schemaUtils";
import {defineMutation, defineQuery} from "../utils/serverGraphqlUtil";

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser, repos}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")
    const existingCheck = await DialogueChecks.findOne({targetUserId, userId: currentUser._id})
    const id = existingCheck ? existingCheck._id : randomId()
    const now = new Date()
    await repos.dialogueChecks.upsertDialogueCheck(id, currentUser._id, targetUserId, checked, now)
    return {
      _id: id,
      userId: currentUser._id,
      targetUserId,
      checked,
      checkedAt: now
    }
  } 
})

defineQuery({
  name: "getUsersDialogueChecks",
  resultType: "[DialogueCheck]",
  argTypes: "",
  fn: async (_, __, {currentUser}) => {
    if (!currentUser) throw new Error("No check user was provided")
    return await DialogueChecks.find({userId: currentUser._id}).fetch()
  }
})

augmentFieldsDict(DialogueChecks, {
  match: {
    resolveAs: {
      fieldName: 'match',
      type: 'Boolean',
      resolver: async (check: DbDialogueCheck, args: void, context: ResolverContext): Promise<Boolean> => {
        const currentUser = context.currentUser
        if (!currentUser) throw Error("Can't get match without current User")
        const matchedUsers = await context.repos.dialogueChecks.checkForMatch(check.userId, check.targetUserId);
        return matchedUsers.length > 0
      },
    }
  }
})
