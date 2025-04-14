import { captureEvent } from '@/lib/analyticsEvents';
import gql from 'graphql-tag';
import ForumEvents from '../collections/forumEvents/collection';

export const forumEventGqlMutations = {
  AddForumEventVote: async (
    _root: void,
    {forumEventId, x, delta, postIds}: {forumEventId: string, x: number, delta?: number, postIds?: string[]},
    {currentUser, repos}: ResolverContext
  ) => {
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    const [event, oldVote] = await Promise.all([
      ForumEvents.findOne({ _id: forumEventId }),
      repos.forumEvents.getUserVote(forumEventId, currentUser._id)
    ]);

    if (event?.endDate && new Date(event.endDate) < new Date()) {
      throw new Error("Cannot edit vote after voting has closed");
    }

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
    await Promise.all([
      repos.forumEvents.addVote(forumEventId, currentUser._id, voteData),
      repos.comments.setLatestPollVote({ forumEventId, latestVote: x, userId: currentUser._id })
    ]);
    captureEvent("addForumEventVote", {
      forumEventId,
      userId: currentUser._id,
      x,
      delta,
      postIds
    })
    return true
  },
  RemoveForumEventVote: async (_root: void, {forumEventId}: {forumEventId: string}, {currentUser, repos}: ResolverContext) => {
    if (!currentUser) {
      throw new Error("Not logged in");
    }
    const event = await ForumEvents.findOne({ _id: forumEventId });

    if (event?.endDate && new Date(event.endDate) < new Date()) {
      throw new Error("Cannot edit vote after voting has closed");
    }

    await Promise.all([
      repos.forumEvents.removeVote(forumEventId, currentUser._id),
      repos.comments.setLatestPollVote({ forumEventId, latestVote: null, userId: currentUser._id })
    ]);
    captureEvent("removeForumEventVote", {
      forumEventId,
      userId: currentUser._id,
    })
    return true
  },
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
}

export const forumEventGqlTypeDefs = gql`
  extend type Mutation {
    AddForumEventVote(forumEventId: String!, x: Float!, delta: Float, postIds: [String]): Boolean
    RemoveForumEventVote(forumEventId: String!): Boolean
    RemoveForumEventSticker(forumEventId: String!, stickerId: String!): Boolean
  }
`
