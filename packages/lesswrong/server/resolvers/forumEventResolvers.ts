import { captureEvent } from '@/lib/analyticsEvents';
import gql from 'graphql-tag';
import ForumEvents from '../collections/forumEvents/collection';

export const forumEventGqlMutations = {
  AddForumEventVote: async (
    _root: void,
    {forumEventId, x, delta, postIds}: {forumEventId: string, x: number, delta?: number, postIds?: string[]},
    {currentUser, repos, loaders}: ResolverContext
  ) => {
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    const [event, oldVote] = await Promise.all([
      loaders.ForumEvents.load(forumEventId),
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
  RemoveForumEventVote: async (_root: void, {forumEventId}: {forumEventId: string}, {currentUser, repos, loaders}: ResolverContext) => {
    if (!currentUser) {
      throw new Error("Not logged in");
    }
    const event = await loaders.ForumEvents.load(forumEventId);

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
  AddForumEventMcVote: async (
    _root: void,
    {forumEventId, answerIds}: {forumEventId: string, answerIds: string[]},
    {currentUser, repos, loaders}: ResolverContext
  ) => {
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    const event = await loaders.ForumEvents.load(forumEventId);
    if (!event) {
      throw new Error("Forum event not found");
    }
    if (event.endDate && new Date(event.endDate) < new Date()) {
      throw new Error("Cannot edit vote after voting has closed");
    }

    const publicData = (event.publicData ?? {}) as {
      answers?: Array<{ _id: string }>;
      multiSelect?: boolean;
    };
    const validAnswerIds = new Set((publicData.answers ?? []).map((a) => a._id));

    // De-dupe, and enforce a single choice server-side for single-select polls.
    const requested = publicData.multiSelect ? answerIds : answerIds.slice(0, 1);
    const newAnswerIds = [...new Set(requested)];
    for (const answerId of newAnswerIds) {
      if (!validAnswerIds.has(answerId)) {
        throw new Error("Unknown answer");
      }
    }

    const empty = newAnswerIds.length === 0;
    await Promise.all([
      // MC votes are stored at the top level of publicData keyed by userId, like
      // the slider, so voting reuses the slider's add/remove vote repo methods.
      empty
        ? repos.forumEvents.removeVote(forumEventId, currentUser._id)
        : repos.forumEvents.addVote(forumEventId, currentUser._id, { answerIds: newAnswerIds }),
      repos.comments.setLatestMcPollVote({
        forumEventId,
        latestAnswerIds: empty ? null : newAnswerIds,
        userId: currentUser._id,
      }),
    ]);

    captureEvent("addForumEventMcVote", {
      forumEventId,
      userId: currentUser._id,
      answerIds: newAnswerIds,
    })
    return newAnswerIds
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
  AddForumEventSticker: async (
    _root: void,
    {forumEventId, stickerId, x, y, theta, emoji}: {forumEventId: string, stickerId: string, x: number, y: number, theta: number, emoji?: string},
    {currentUser, repos, loaders}: ResolverContext,
  ) => {
    if (!currentUser) {
      throw new Error("Permission denied");
    }

    const forumEvent = await loaders.ForumEvents.load(forumEventId);
    if (!forumEvent) {
      throw new Error("Forum event not found");
    }

    await repos.forumEvents.upsertSticker({
      forumEventId,
      stickerData: {
        _id: stickerId,
        x,
        y,
        theta,
        emoji: emoji ?? null,
        userId: currentUser._id,
      },
      maxStickersPerUser: forumEvent.maxStickersPerUser,
    });

    captureEvent("addForumEventSticker", {
      forumEventId,
      userId: currentUser._id,
      stickerId,
    });
    return true;
  },
}

export const forumEventGqlTypeDefs = gql`
  extend type Mutation {
    AddForumEventVote(forumEventId: String!, x: Float!, delta: Float, postIds: [String]): Boolean
    RemoveForumEventVote(forumEventId: String!): Boolean
    AddForumEventMcVote(forumEventId: String!, answerIds: [String!]!): [String!]
    RemoveForumEventSticker(forumEventId: String!, stickerId: String!): Boolean
    AddForumEventSticker(forumEventId: String!, stickerId: String!, x: Float!, y: Float!, theta: Float!, emoji: String): Boolean
  }
`
