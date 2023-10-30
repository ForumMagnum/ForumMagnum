//import { isDialogueParticipant } from "../../components/posts/PostsPage/PostsPage";
import DialogueChecksRepo from "../repos/DialogueChecksRepo";
import {defineMutation, defineQuery} from "../utils/serverGraphqlUtil";

defineMutation({
  name: "upsertUserDialogueCheck",
  resultType: "DialogueCheck",
  argTypes: "(targetUserId: String!, checked: Boolean!)",
  fn: async (_, {targetUserId, checked}:{targetUserId:string, checked:boolean}, {currentUser}) => {
    if (!currentUser) throw new Error("No check user was provided")
    if (!targetUserId) throw new Error("No target user was provided")

    await new DialogueChecksRepo().upsertDialogueCheck(currentUser._id, targetUserId, checked)
  } 
})

defineQuery({
  name: "getUsersDialogueChecks",
  resultType: "[DialogueCheck]",
  argTypes: "",
  fn: async (_, __, {currentUser}) => {
    if (!currentUser) throw new Error("No check user was provided")

    return new DialogueChecksRepo().getUsersDialogueChecks(currentUser._id)
  }
})

defineQuery({
  name: "getMatchedUsers",
  resultType: "[DialogueCheck]",
  argTypes: "(targetUserIds: [String!]!)",
  fn: async (_, { targetUserIds }, { currentUser }) => {
    if (!currentUser) throw new Error("No check user was provided");

    const matchedUsers = await new DialogueChecksRepo().getMatchedUsers(
      currentUser._id,
      targetUserIds
    );

    return matchedUsers;
  },
});
