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
    // TODO Add back in for the case where we allow stickers without comments
    // UpsertForumEventSticker: async (
    //   _root: void,
    //   {forumEventId, x, y, theta, emoji}: {
    //     forumEventId: string} & ForumEventSticker,
    //   {currentUser, repos}: ResolverContext,
    // ) => {
    //   if (!currentUser) {
    //     throw new Error("Permission denied");
    //   }
    //
    //   await repos.forumEvents.upsertSticker(forumEventId, currentUser._id, {x, y, theta, emoji: emoji})
    //   captureEvent("addForumEventSticker", {
    //     forumEventId,
    //     userId: currentUser._id,
    //     x, y, theta, emoji
    //   })
    //   return true
    // },
    RemoveForumEventSticker: async (
      _root: void,
      {forumEventId, stickerId}: {forumEventId: string, stickerId: string},
      {currentUser, repos}: ResolverContext,
    ) => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }

      await repos.forumEvents.removeSticker({ forumEventId, stickerId, userId: currentUser._id })

      captureEvent("removeForumEventSticker", {
        forumEventId,
        userId: currentUser._id
      })
      return true;
    },
  },
})

addGraphQLMutation('AddForumEventVote(forumEventId: String!, x: Float!, delta: Float, postIds: [String]): Boolean')
addGraphQLMutation('RemoveForumEventVote(forumEventId: String!): Boolean')
addGraphQLMutation('UpsertForumEventSticker(forumEventId: String!, x: Float!, y: Float!, theta: Float!, emoji: String): Boolean')
addGraphQLMutation('RemoveForumEventSticker(forumEventId: String!, stickerId: String!): Boolean')
