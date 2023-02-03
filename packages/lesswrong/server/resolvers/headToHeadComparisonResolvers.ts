import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { isValidCollectionName } from '../../lib/vulcan-lib/getCollection';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils'
import { defineQuery } from '../utils/serverGraphqlUtil';
import { getRecommendedPosts } from '../recommendations/recommendations';
import { Posts } from '../../lib/collections/posts/collection';
import { getCollectionHooks } from '../mutationCallbacks';
import cloneDeep from 'lodash/cloneDeep';
import keyBy from 'lodash/keyBy';

defineQuery({
  name: "headToHeadPostComparison",
  schema: `
    type HeadToHeadPostComparison {
      firstPost: Post
      secondPost: Post
    }
  `,
  resultType: "HeadToHeadPostComparison",
  fn: async (root: void, args: {}, context: ResolverContext): Promise<{
    firstPost: DbPost,
    secondPost: DbPost,
  }> => {
    const { currentUser } = context;
    if (!currentUser) throw new Error("Must be logged in");
    
    // Get two different randomly selected posts that are both marked as read
    const posts = await getRecommendedPosts({
      currentUser, count: 2,
      algorithm: {
        method: "sample",
        scoreOffset: 100,
        scoreExponent: 0,
        onlyRead: true,
        includePersonal: true,
        excludeDefaultRecommendations: true,
      }
    });
    
    const accessFilteredPosts = await accessFilterMultiple(currentUser, Posts, posts, context);
    const [firstPost,secondPost] = accessFilteredPosts;
    
    return {firstPost, secondPost} as any;
  }
});

type RatingAxis = "whichHappierItWasWritten"|"whichHappierToHaveRead";

type Rating = Record<RatingAxis, {
  eloRating: number,
  numComparisons: number,
}>

const startingScores = {
  whichHappierItWasWritten: { eloRating: 1000, numComparisons: 0 },
  whichHappierToHaveRead: { eloRating: 1000, numComparisons: 0 }
};

getCollectionHooks("PostComparisons").createAsync.add(
  async function createPostComparisonHook ({newDocument: comparison}) {
    const posts = await Posts.find({_id: {$in: comparison.postIds}}).fetch();
    const postsById = keyBy(posts, post => post._id);
    const orderedPosts = comparison.postIds.map(postId => postsById[postId]);
    let scores = orderedPosts.map(post => (
      post.eloRatings ?? cloneDeep(startingScores)
    ));

    console.log(scores)
    console.log(comparison)

    if(posts.length != 2) throw new Error("Multi-way comparisons not yet supported.");

    Object.entries(comparison.rankings).map(([ratingAxis, rankings]: [RatingAxis, number[]]) => { 
      const { postAScore, postBScore } = getUpdatedRatings(scores[0][ratingAxis].eloRating, scores[1][ratingAxis].eloRating, rankings[0]);
      scores[0][ratingAxis].eloRating = postAScore;
      scores[0][ratingAxis].numComparisons++;
      scores[1][ratingAxis].eloRating = postBScore;
      scores[1][ratingAxis].numComparisons++;
     });

    console.log(scores)

    await Promise.all(comparison.postIds.map((postId, i) => Posts.rawUpdateOne(
      { _id: postId },
      {$set: { eloRatings: scores[i] }}
    )));
  }
)

function getUpdatedRatings(postAScore: number, postBScore: number, ranking: number): {
  postAScore: number,
  postBScore: number,
} {
  const rankingZeroToOne = (ranking===0) ? 0.5 : (ranking>0) ? 1 : 0;
  const postAProbability = 1 / (1 + Math.pow(10, (postBScore - postAScore) / 400));
  const postBProbability = 1 / (1 + Math.pow(10, (postAScore - postBScore) / 400));
  
  const postAUpdate = 32 * (rankingZeroToOne - postAProbability);
  const postBUpdate = 32 * ((1 - rankingZeroToOne) - postBProbability);
  
  return {
    postAScore: postAScore + postAUpdate,
    postBScore: postBScore + postBUpdate,
  }
}
