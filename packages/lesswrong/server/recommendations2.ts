import { defineQuery } from './utils/serverGraphqlUtil';
import { Posts } from '../lib/collections/posts/collection';
import { Votes } from '../lib/collections/votes/collection';
import { Comments } from '../lib/collections/comments/collection';
import { PostEmbeddings } from '../lib/collections/postEmbeddings/collection';
import { getDefaultViewSelector } from '../lib/utils/viewUtils';
import { scoringFeatureConstructors,ScoringContext,PostScoringFeature,ServerPostScoringFeature,PostScoringKarmaOptions,PostScoringKarma,PostScoringTimeDecayOptions,PostScoringTimeDecay,PostScoringSimilarityOptions,PostScoringSimilarity,PostScoringRecentCommentsOptions,PostScoringRecentComments,RecommendationsQuery,RecommendationResult,FeatureName,RecommendationRubric } from '../lib/recommendationTypes';
import { normalizeVector, vectorSum, scaleVector, vectorDotProduct } from './utils/vectorUtil';
import moment from "moment";
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';
import keyBy from 'lodash/keyBy';
import sumBy from 'lodash/sumBy';

class PostScoringKarmaServer extends PostScoringKarma {
  scoreBatch = async (posts: DbPost[], ctx: ScoringContext, options: PostScoringKarmaOptions): Promise<number[]> => {
    const karmaAtTime = await Promise.all(posts.map(async (post) => {
      return await getKarmaAtTime(post, ctx.now);
    }));
    return posts.map((post,i) =>
      this.rescaleKarma(options, karmaAtTime[i])
    );
  }
}

class PostScoringTimeDecayServer extends PostScoringTimeDecay {
  scoreBatch = async (posts: DbPost[], ctx: ScoringContext, options: PostScoringTimeDecayOptions): Promise<number[]> => {
    return posts.map(post => {
      const ageInMS = ctx.now.getTime() - post.postedAt.getTime()
      const ageInHours = ageInMS / (1000*60*60);
      if (ageInHours <= 0) return 1.0;
      return 1.0 / Math.pow(options.ageOffset+ageInHours, options.exponent);
    });
  }
}

class PostScoringSimilarityServer extends PostScoringSimilarity {
  scoreBatch = async (posts: DbPost[], ctx: ScoringContext, options: PostScoringSimilarityOptions): Promise<number[]> => {
    // If no target posts selected, similarity modifier is just 0
    if (!options.posts.length) {
      return posts.map(p=>0.0);
    }
    
    // Fetch embeddings for target and candidate posts
    const targetPostEmbeddings = await PostEmbeddings.find({
      postId: {$in: options.posts.map(p=>p.postId)}
    }).fetch();
    const targetPostEmbeddingsByPostId = keyBy(targetPostEmbeddings, e=>e.postId);
    
    const candidatePostEmbeddings = await PostEmbeddings.find({
      postId: {$in: posts.map(p=>p._id)}
    }).fetch();
    const candidatePostEmbeddingsByPostId = keyBy(candidatePostEmbeddings, e=>e.postId);
    
    // Construct a combined target vector by weighted-sum of the selected posts,
    // then normalizing.
    const targetEmbedding: number[] = normalizeVector(vectorSum(
      ...options.posts.map(p => scaleVector(
        targetPostEmbeddingsByPostId[p.postId].embeddingVector ?? [],
        p.weight
      ))
    ));
    
    // Return dot-products of the embeddings of the candidate posts with the
    // target vector.
    return posts.map(post => {
      const candidateEmbedding = candidatePostEmbeddingsByPostId[post._id]?.embeddingVector;
      if (!candidateEmbedding)
        return 0;
      
      return vectorDotProduct(targetEmbedding, candidateEmbedding);
    });
  }
}

class PostScoringRecentCommentsServer extends PostScoringRecentComments {
  scoreBatch = async (posts: DbPost[], ctx: ScoringContext, options: PostScoringRecentCommentsOptions): Promise<number[]> => {
    const mostRecentCommentSince: (Date|null)[] = await Promise.all(posts.map(async (post) => {
      if (post.lastCommentedAt < ctx.now) {
        return post.lastCommentedAt;
      } else {
        return await getDateOfLastCommentBefore(post, ctx.now);
      }
    }));
    return posts.map((post,i) => {
      const commentDate = mostRecentCommentSince[i];
      if (!commentDate) return 0;
      const commentAgeMs = ctx.now.getTime() - commentDate.getTime();
      const commentAgeHours = commentAgeMs / (1000*60*60);
      return (commentAgeHours < 24) ? 1.0 : 0.0;
    });
  }
}

/**
 * Get a post's karma at a given timestamp (for purposes of recommendations with a simulated date).
 * (This is pretty slow.)
 */
async function getKarmaAtTime(post: DbPost, date: Date|null): Promise<number> {
  if (!date) {
    return post.baseScore;
  }
  
  const applicableVotes = await Votes.find({
    documentId: post._id,
    cancelled: false,
    votedAt: {$lt: date},
  }, {
    projection: {power:1}
  }).fetch();
  return sumBy(applicableVotes, v=>v.power);
}

async function getDateOfLastCommentBefore(post: DbPost, date: Date): Promise<Date|null> {
  if (!post.commentCount)
    return null;
  
  const lastCommentBefore = await Comments.find({
    ...getDefaultViewSelector("Comments"),
    postId: post._id,
    postedAt: {$lte: date},
  }, {
    limit: 1,
    sort: {postedAt:-1},
    projection: {postedAt:1},
  }).fetch();
  
  if (!lastCommentBefore.length)
    return null;
  return lastCommentBefore[0].postedAt;
}

// TODO: PostScoringTagModifiers

type ServerScoringFeature<T extends new (...args: any) => PostScoringFeature<any>> =
  T extends new (...args: any) => PostScoringFeature<infer U>
    ? ServerPostScoringFeature<U>
    : never;

type ServerScoringFeatures<T extends readonly (new (...args: any) => PostScoringFeature<any>)[]> = {
  [index in keyof T]: ServerScoringFeature<T[index]>
};

const serverScoringFeatures: ServerScoringFeatures<typeof scoringFeatureConstructors> = [
  new PostScoringKarmaServer(),
  new PostScoringTimeDecayServer(),
  new PostScoringSimilarityServer(),
  new PostScoringRecentCommentsServer(),
];
const serverScoringFeaturesByName = keyBy(serverScoringFeatures, f=>f.name);

defineQuery({
  name: "getCustomRecommendations",
  resultType: "JSON!",
  argTypes: "(options: JSON!)",
  fn: async (root: void, {options}: {options: RecommendationsQuery}, context: ResolverContext): Promise<RecommendationResult[]> => {
    /*if (!context.currentUser || !context.currentUser.isAdmin) {
      throw new Error("This API is only accessible to admins");
    }*/
    
    // eslint-disable-next-line no-console
    console.log(`getCustomRecommendations(${JSON.stringify(options)})`);
    
    // Unpack arguments
    const simulatedDate = options.overrideDate ? new Date(options.overrideDate) : new Date();
    
    // Fetch candidate posts
    const ninetyDaysAgo = moment(simulatedDate).add(-90,'days').toDate();
    const candidatePosts = await Posts.find({
      ...getDefaultViewSelector("Posts"),
      postedAt: {
        $gt: ninetyDaysAgo,
        $lte: simulatedDate,
      },
    }).fetch();
    //console.log(`Found ${candidatePosts.length} candidate posts within the specified date range (${ninetyDaysAgo.toString()} to ${simulatedDate.toString()})`);
    
    // Extract features
    const featureCtx = {
      now: simulatedDate,
      currentUser: context.currentUser,
    };
    const featureScores: number[][] = await Promise.all(
      serverScoringFeatures.map(async (feature) => {
        const featureOptions = options.features.find(f=>f.name===feature.name)?.options ?? feature.getDefaultOptions();
        return feature.scoreBatch(candidatePosts, featureCtx, featureOptions);
      })
    );
    const featureScoresByFeatureName: Record<FeatureName,number[]> = {};
    for (let i=0; i<serverScoringFeatures.length; i++) {
      featureScoresByFeatureName[serverScoringFeatures[i].name] = featureScores[i];
    }
    
    // Combine additive features
    const overallScores: RecommendationResult[] = candidatePosts.map((post,i) => {
      let overallScore = 0;
      const featuresRubric: RecommendationRubric = [];
      for (let feature of options.features) {
        if (serverScoringFeaturesByName[feature.name].scoreMode !== "additive")
          continue;
        
        const featureScore = featureScoresByFeatureName[feature.name][i];
        overallScore += featureScore;
        featuresRubric.push({
          feature: feature.name,
          mode: "additive", //TODO
          value: featureScore,
        });
      }
      return {
        postId: post._id,
        score: overallScore,
        featuresRubric,
      };
    });
    
    // Apply multiplicative features
    for (let [i,feature] of options.features.entries()) {
      const featureImpl = serverScoringFeatures[i];
      if (featureImpl.scoreMode !== "multiplicative")
        continue;
      
      for (let [j,overallScore] of overallScores.entries()) {
        overallScore.score *= featureScores[i][j];
        overallScore.featuresRubric.push({
          feature: feature.name,
          mode: featureImpl.scoreMode,
          value: featureScores[i][j],
        });
      }
    }
    
    // Return top candidate posts
    const sortedResults = orderBy(overallScores, r=>-r.score);
    const topResults = take(sortedResults, options.limit);
    // eslint-disable-next-line no-console
    console.log(topResults);
    return topResults;
  }
});
