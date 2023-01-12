import { defineQuery } from './utils/serverGraphqlUtil';
import { Posts } from '../lib/collections/posts/collection';
import { PostEmbeddings } from '../lib/collections/postEmbeddings/collection';
import { getDefaultViewSelector } from '../lib/utils/viewUtils';
import { scoringFeatureConstructors,ScoringContext,PostScoringFeature,ServerPostScoringFeature,PostScoringKarmaOptions,PostScoringKarma,PostScoringSimilarityOptions,PostScoringSimilarity,PostScoringRecentCommentsOptions,PostScoringRecentComments,RecommendationsQuery,RecommendationResult,FeatureName } from '../lib/recommendationTypes';
import { normalizeVector, vectorSum, scaleVector, vectorDotProduct } from './utils/vectorUtil';
import moment from "moment";
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';
import keyBy from 'lodash/keyBy';

class PostScoringKarmaServer extends PostScoringKarma {
  scoreBatch = async (posts: DbPost[], ctx: ScoringContext, options: PostScoringKarmaOptions): Promise<number[]> => {
    return posts.map(post =>
      this.rescaleKarma(options, post.baseScore)
    );
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
    // TODO
    return posts.map(post => 0); //TODO
  }
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
  new PostScoringSimilarityServer(),
  new PostScoringRecentCommentsServer(),
];


defineQuery({
  name: "getCustomRecommendations",
  resultType: "JSON!",
  argTypes: "(options: JSON!)",
  fn: async (root: void, {options}: {options: RecommendationsQuery}, context: ResolverContext): Promise<RecommendationResult[]> => {
    // eslint-disable-next-line no-console
    console.log(`getCustomRecommendations(${JSON.stringify(options)})`);
    
    // Unpack arguments
    const simulatedDate = options.overrideDate || new Date();
    
    // Fetch candidate posts
    const ninetyDaysAgo = moment(simulatedDate).add(-90,'days').toDate();
    const candidatePosts = await Posts.find({
      ...getDefaultViewSelector("Posts"),
      postedAt: {
        $gt: ninetyDaysAgo,
        $lte: simulatedDate,
      },
    }).fetch();
    console.log(`Found ${candidatePosts.length} candidate posts within the specified date range (${ninetyDaysAgo.toString()} to ${simulatedDate.toString()})`);
    
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
    
    // Combine features into overall scores
    const overallScores: RecommendationResult[] = candidatePosts.map((post,i) => {
      let overallScore = 0;
      const featuresRubric: Array<{feature:string,value:number}> = [];
      for (let feature of options.features) {
        const featureScore =featureScoresByFeatureName[feature.name][i]; 
        overallScore += featureScore;
        featuresRubric.push({
          feature: feature.name,
          value: featureScore,
        });
      }
      return {
        postId: post._id,
        score: overallScore,
        featuresRubric,
      };
    });
    
    // Return top candidate posts
    const sortedResults = orderBy(overallScores, r=>-r.score);
    const topResults = take(sortedResults, options.limit);
    // eslint-disable-next-line no-console
    console.log(topResults);
    return topResults;
  }
});
