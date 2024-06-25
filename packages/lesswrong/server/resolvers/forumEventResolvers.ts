import { addGraphQLMutation, addGraphQLResolvers } from '../vulcan-lib';


addGraphQLResolvers({
  Mutation: {
    AddForumEventVote: async (
      _root: void,
      {forumEventId, x, delta, postIds}: {forumEventId: string, x: number, delta: number, postIds: string[]},
      {currentUser, repos}: ResolverContext
    ) => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }
      console.log('AddForumEventVote', x, delta, postIds)
      if (!delta) {
        return true
      }
      
      const voteData = {
        x,
        points: {}
      }
      if (postIds?.length) {
        const oldVote = await repos.forumEvents.getUserVote(forumEventId, currentUser._id)
        const pointsPerPost = Math.abs(delta)
        voteData.points = postIds.reduce((prev: Record<string, number>, next) => {
          if (next in prev) {
            prev[next] += pointsPerPost
          } else {
            prev[next] = pointsPerPost
          }
          return prev
        }, oldVote?.points ?? {})
      }
      repos.forumEvents.addVote(forumEventId, currentUser._id, voteData)
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

addGraphQLMutation('AddForumEventVote(forumEventId: String!, x: Int!, delta: Int!, postIds: [String]): Boolean')
addGraphQLMutation('RemoveForumEventVote(forumEventId: String!): Boolean')
