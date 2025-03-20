import gql from "graphql-tag";
import { isDialogueParticipant } from "../../components/posts/PostsPage/PostsPage";
import TypingIndicatorsRepo from "../repos/TypingIndicatorsRepo";

export const typingIndicatorsGqlMutations = {
  async upsertUserTypingIndicator (_: void, {documentId}: {documentId: string}, {currentUser, loaders}: ResolverContext) {
    if (!currentUser) throw new Error("No user was provided")
    const post = await loaders.Posts.load(documentId)
    if (!post) throw new Error("No post was provided")
    if (!post.debate) throw new Error("Post is not a dialogue")
    if (!isDialogueParticipant(currentUser._id, post)) throw new Error("User is not a dialog participant")

    await new TypingIndicatorsRepo().upsertTypingIndicator(currentUser._id, post._id)
  } 
}

export const typingIndicatorsGqlTypeDefs = gql`
  extend type Mutation {
    upsertUserTypingIndicator(documentId: String!): TypingIndicator
  }
`
