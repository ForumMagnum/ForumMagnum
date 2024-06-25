import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from '../vulcan-lib';

addGraphQLResolvers({
  Mutation: {
    AddForumEventVote: (_root: void, {forumEventId, left}: {forumEventId: string, left: number}, {currentUser, repos}: ResolverContext) => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }
      repos.forumEvents.addVote(forumEventId, currentUser._id, left)
      return true
    },
    RemoveForumEventVote: (_root: void, {forumEventId}: {forumEventId: string}, {currentUser, repos}: ResolverContext) => {
      if (!currentUser) {
        throw new Error("Not logged in");
      }
      repos.forumEvents.removeVote(forumEventId, currentUser._id)
      return true
    },
  },
})

addGraphQLMutation('AddForumEventVote(forumEventId: String!, left: Int!): Boolean')
addGraphQLMutation('RemoveForumEventVote(forumEventId: String!): Boolean')
