import { updateMutator } from '../vulcan-lib/mutators';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { Posts } from '../../server/collections/posts/collection'
import { ReviewVotes } from '../../server/collections/reviewVotes/collection'
import { GivingSeasonHeart } from "../../components/review/ReviewVotingCanvas";
import { REVIEW_YEAR, reviewElectionName } from '../../lib/reviewUtils';
import { TARGET_REVIEW_VOTING_NUM } from '../../components/review/ReviewProgressVoting';
import gql from 'graphql-tag';
import { createReviewVote } from '../collections/reviewVotes/mutations';

export const reviewVoteGraphQLTypeDefs = gql`
  type GivingSeasonHeart {
    userId: String!
    displayName: String!
    x: Float!
    y: Float!
    theta: Float!
  }
  extend type Mutation {
    submitReviewVote(postId: String, qualitativeScore: Int, quadraticChange: Int, newQuadraticScore: Int, comment: String, year: String, dummy: Boolean, reactions: [String]): Post
    AddGivingSeasonHeart(
      electionName: String!,
      x: Float!,
      y: Float!,
      theta: Float!
    ): [GivingSeasonHeart!]!
    RemoveGivingSeasonHeart(electionName: String!): [GivingSeasonHeart!]!
  }
  extend type Query {
    GivingSeasonHearts(electionName: String!): [GivingSeasonHeart!]!
  }
`

export const reviewVoteGraphQLQueries = {
  GivingSeasonHearts: async (
    _root: void,
    {electionName}: {electionName: string},
    context: ResolverContext,
  ): Promise<GivingSeasonHeart[]> => {
    if (electionName !== reviewElectionName) {
      throw new Error('Invalid electionName!');
    }
    
    return context.repos.databaseMetadata.getGivingSeasonHearts(electionName);
  },
}

export const reviewVoteGraphQLMutations = {
  submitReviewVote: async (root: void, args: { postId: string, qualitativeScore: number, quadraticChange: number, newQuadraticScore: number, comment: string, year: string, dummy: boolean, reactions: string[] }, context: ResolverContext): Promise<DbPost> =>  {
    const { postId, qualitativeScore, quadraticChange, newQuadraticScore, comment, year, dummy, reactions } = args;
    const { currentUser } = context;
    if (!currentUser) throw new Error("You must be logged in to submit a review vote");
    if (!postId) throw new Error("Missing argument: postId");
    
    const post = await Posts.findOne({_id: postId});
    if (!await accessFilterSingle(currentUser, 'Posts', post, context))
      throw new Error("Invalid postId");
    
    // Check whether this post already has a review vote
    const existingVote = await ReviewVotes.findOne({ postId, userId: currentUser._id });
    if (!existingVote) {
      const finalQuadraticScore = (typeof newQuadraticScore !== 'undefined' ) ? newQuadraticScore : (quadraticChange || 0)
      await createReviewVote({
        data: { postId, qualitativeScore, quadraticScore: finalQuadraticScore, comment, year, dummy, reactions }
      }, context, true);
      const newPost = await Posts.findOne({_id:postId})
      if (!newPost) throw Error("Can't find post corresponding to Review Vote")
      return newPost
    } else {
      // TODO:(Review) this could potentially introduce a race condition where
      // the user does two increments in a row and the second read happens
      // before the first write, leading to the discarding of the first
      // increment. We should consider adding an increment option to
      // updateMutator 
      const finalQuadraticScore = typeof newQuadraticScore !== 'undefined' ?
        newQuadraticScore :
        existingVote.quadraticScore + (quadraticChange || 0)
      await updateMutator({
        collection: ReviewVotes,
        documentId: existingVote._id,
        set: {
          postId, 
          qualitativeScore, 
          comment, 
          year,
          dummy,
          reactions,
          quadraticScore: finalQuadraticScore
        },
        validate: false,
        currentUser,
      })
      const newPost = await Posts.findOne({_id:postId})
      if (!newPost) throw Error("Can't find post corresponding to Review Vote")
      return newPost 
    }
  },
  AddGivingSeasonHeart: async (
    _root: void,
    {electionName, x, y, theta}: {
      electionName: string,
      x: number,
      y: number,
      theta: number,
    },
    context: ResolverContext,
  ): Promise<GivingSeasonHeart[]> => {
    if (!context.currentUser) {
      throw new Error("Permission denied");
    }
    if (
      electionName !== reviewElectionName || 
      typeof x !== "number" || x < 0 || x > 1 ||
      typeof y !== "number" || y < 0 || y > 1 ||
      typeof theta !== "number" || theta < -25 || theta > 25
    ) {
      throw new Error(`Invalid parameters: ${{electionName, x, y, theta}}`);
    }

    const voteCount = await ReviewVotes.find({
      userId: context.currentUser._id,
      year: REVIEW_YEAR+""
    }).count();

    if (voteCount < TARGET_REVIEW_VOTING_NUM) {
      throw new Error(`User has not voted enough times: ${voteCount}`)
    }

    return context.repos.databaseMetadata.addGivingSeasonHeart(
      electionName,
      context.currentUser._id,
      x,
      y,
      theta,
    );
  },
  RemoveGivingSeasonHeart: (
    _root: void,
    {electionName}: {electionName: string},
    context: ResolverContext,
  ) => {
    if (!context.currentUser) {
      throw new Error("Permission denied");
    }

    if (electionName !== reviewElectionName) {
      throw new Error('Invalid electionName!');
    }

    return context.repos.databaseMetadata.removeGivingSeasonHeart(
      electionName,
      context.currentUser._id,
    );
  },
}
