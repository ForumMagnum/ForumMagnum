import { captureEvent } from '@/lib/analyticsEvents';
import { addGraphQLMutation, addGraphQLResolvers } from '../vulcan-lib';


addGraphQLResolvers({
  Mutation: {
    AddForumEventVote: async (
      _root: void,
      {forumEventId, x, delta, postIds}: {forumEventId: string, x: number, delta?: number, postIds?: string[]},
      {currentUser, repos}: ResolverContext
    ) => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }
      
      const oldVote = await repos.forumEvents.getUserVote(forumEventId, currentUser._id)
      const voteData = {
        x,
        points: oldVote?.points ?? {}
      }
      // Update the points associated with this vote if there was a change and that change was associated with posts
      if (postIds?.length && !!delta) {
        const pointsPerPost = Math.abs(delta)
        postIds.forEach(postId => {
          // Each post gets points equal to the max change attributed to that post
          voteData.points[postId] = Math.max(pointsPerPost, voteData.points?.[postId] ?? 0)
        })
      }
      repos.forumEvents.addVote(forumEventId, currentUser._id, voteData)
      captureEvent("addForumEventVote", {
        forumEventId,
        userId: currentUser._id,
        x,
        delta,
        postIds
      })
      return true
    },
    RemoveForumEventVote: (_root: void, {forumEventId}: {forumEventId: string}, {currentUser, repos}: ResolverContext) => {
      if (!currentUser) {
        throw new Error("Not logged in");
      }
      repos.forumEvents.removeVote(forumEventId, currentUser._id)
      captureEvent("removeForumEventVote", {
        forumEventId,
        userId: currentUser._id,
      })
      return true
    },
    AddForumEventSticker: async (
      _root: void,
      {forumEventId, x, y, theta}: {
        forumEventId: string,
        x: number,
        y: number,
        theta: number,
      },
      {currentUser, repos}: ResolverContext,
    ) => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }

      await repos.forumEvents.addSticker(forumEventId, currentUser._id, {x, y, theta})
      captureEvent("addForumEventSticker", {
        forumEventId,
        userId: currentUser._id,
        x, y, theta
      })
      return true
    },
    RemoveForumEventSticker: async (
      _root: void,
      {forumEventId}: {forumEventId: string},
      {currentUser, repos}: ResolverContext,
    ) => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }

      await repos.forumEvents.removeSticker(forumEventId, currentUser._id)
      captureEvent("addForumEventSticker", {
        forumEventId,
        userId: currentUser._id
      })
      return true;
    },
  },
})

addGraphQLMutation('AddForumEventVote(forumEventId: String!, x: Float!, delta: Float, postIds: [String]): Boolean')
addGraphQLMutation('RemoveForumEventVote(forumEventId: String!): Boolean')
addGraphQLMutation('AddForumEventSticker(forumEventId: String!, x: Float!, y: Float!, theta: Float!): Boolean')
addGraphQLMutation('RemoveForumEventSticker(forumEventId: String!): Boolean')
