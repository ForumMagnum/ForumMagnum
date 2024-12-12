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
    // AddForumEventSticker: async (
    //   _root: void,
    //   {forumEventId, x, y, theta}: {
    //     forumEventId: string,
    //     x: number,
    //     y: number,
    //     theta: number,
    //   },
    //   context: ResolverContext,
    // ): Promise<GivingSeasonHeart[]> => {


    //   // TODO
    //   // if (!context.currentUser) {
    //   //   throw new Error("Permission denied");
    //   // }
    //   // if (
    //   //   electionName !== 'reviewVoting2022' || 
    //   //   typeof x !== "number" || x < 0 || x > 1 ||
    //   //   typeof y !== "number" || y < 0 || y > 1 ||
    //   //   typeof theta !== "number" || theta < -25 || theta > 25
    //   // ) {
    //   //   throw new Error(`Invalid parameters: ${{electionName, x, y, theta}}`);
    //   // }

    //   // const voteCount = await ReviewVotes.find({
    //   //   userId: context.currentUser._id,
    //   //   year: REVIEW_YEAR+""
    //   // }).count();

    //   // if (voteCount < TARGET_REVIEW_NUM) {
    //   //   throw new Error(`User has not voted enough times: ${voteCount}`)
    //   // }

    //   // return context.repos.databaseMetadata.addGivingSeasonHeart(
    //   //   electionName,
    //   //   context.currentUser._id,
    //   //   x,
    //   //   y,
    //   //   theta,
    //   // );
    // },
    // RemoveForumEventSticker: (
    //   _root: void,
    //   {forumEventId}: {forumEventId: string},
    //   context: ResolverContext,
    // ) => {
    //   // TODO
    //   // if (!context.currentUser) {
    //   //   throw new Error("Permission denied");
    //   // }

    //   // if (electionName !== 'reviewVoting2022') {
    //   //   throw new Error('Invalid electionName!');
    //   // }

    //   // return context.repos.databaseMetadata.removeGivingSeasonHeart(
    //   //   electionName,
    //   //   context.currentUser._id,
    //   // );
    // },
  },
})

addGraphQLMutation('AddForumEventVote(forumEventId: String!, x: Float!, delta: Float, postIds: [String]): Boolean')
addGraphQLMutation('RemoveForumEventVote(forumEventId: String!): Boolean')
