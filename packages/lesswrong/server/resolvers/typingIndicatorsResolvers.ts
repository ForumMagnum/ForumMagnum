import { isDialogueParticipant } from "@/lib/collections/posts/helpers";
import TypingIndicatorsRepo from "../repos/TypingIndicatorsRepo";
import {defineMutation} from "../utils/serverGraphqlUtil";

defineMutation({
  name: "upsertUserTypingIndicator",
  resultType: "TypingIndicator",
  argTypes: "(documentId: String!)",
  fn: async (_, {documentId}: {documentId: string}, {currentUser, loaders}) => {
    if (!currentUser) throw new Error("No user was provided")
    const post = await loaders.Posts.load(documentId)
    if (!post) throw new Error("No post was provided")
    if (!post.debate) throw new Error("Post is not a dialogue")
    if (!isDialogueParticipant(currentUser._id, post)) throw new Error("User is not a dialog participant")

    await new TypingIndicatorsRepo().upsertTypingIndicator(currentUser._id, post._id)
  } 
})
