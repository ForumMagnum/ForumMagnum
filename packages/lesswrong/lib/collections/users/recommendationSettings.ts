import SimpleSchema from 'simpl-schema';
import { addFieldsDict } from '../../utils/schemaUtils';
import Users from "../users/collection";
import { userOwns } from '../../vulcan-users/permissions';
import { ReviewYear } from '../../reviewUtils';
import { TupleSet, UnionOf } from '../../utils/typeGuardUtils';
import BestOfStrategy from '../../recommendations/BestOfStrategy';
import CollabFilterStrategy from '../../recommendations/CollabFilterStrategy';
import FeatureStrategy from '../../recommendations/FeatureStrategy';
import MoreFromAuthorStrategy from '../../recommendations/MoreFromAuthorStrategy';
import MoreFromTagStrategy from '../../recommendations/MoreFromTagStrategy';
import NewAndUpvotedInTagStrategy from '../../recommendations/NewAndUpvotedInTagStrategy';
import TagWeightedCollabFilterStrategy from '../../recommendations/TagWeightedCollabFilter';
import type { ContextualRecommendationStrategy } from '../../recommendations/RecommendationStrategy';
import { ContextualFeature, featureRegistry } from '../../recommendations/Feature';

export const recommendationStrategies = {
  newAndUpvotedInTag: NewAndUpvotedInTagStrategy,
  moreFromTag: MoreFromTagStrategy,
  moreFromAuthor: MoreFromAuthorStrategy,
  bestOf: BestOfStrategy,
  tagWeightedCollabFilter: TagWeightedCollabFilterStrategy,
  collabFilter: CollabFilterStrategy,
  feature: FeatureStrategy,
};

export const recommendationStrategyNames = new TupleSet(Object.keys(recommendationStrategies) as (keyof typeof recommendationStrategies)[]);

export const isRecommendationStrategyName =
  (name: string): name is RecommendationStrategyName =>
    recommendationStrategyNames.has(name);

export type RecommendationStrategyName = UnionOf<typeof recommendationStrategyNames>;

export type ContextualRecommendationStrategyName = {
  [k in RecommendationStrategyName]: InstanceType<(typeof recommendationStrategies)[k]> extends ContextualRecommendationStrategy ? k : never;
}[RecommendationStrategyName];

export type NonContextualRecommendationStrategyName = Exclude<RecommendationStrategyName, ContextualRecommendationStrategyName>;

export const recommendationFeatureNames = new TupleSet(Object.keys(featureRegistry) as (keyof typeof featureRegistry)[]);

export const isRecommendationFeatureName =
  (name: string): name is RecommendationFeatureName =>
    recommendationFeatureNames.has(name);

export type RecommendationFeatureName = UnionOf<typeof recommendationFeatureNames>;

export type ContextualRecommendationFeatureName = {
  [k in RecommendationFeatureName]: InstanceType<(typeof featureRegistry)[k]> extends ContextualFeature ? k : never;
}[RecommendationFeatureName];

export type NonContextualRecommendationFeatureName = Exclude<RecommendationFeatureName, ContextualRecommendationFeatureName>;

export type WeightedFeature<PostIdAvailable extends boolean = boolean> = {
  feature: PostIdAvailable extends true ? RecommendationFeatureName : NonContextualRecommendationFeatureName,
  weight: number,
}

// export type ContextualWeightedFeature = {
//   feature: ContextualRecommendationFeatureName,
//   weight: number,
// }

interface ContextualStrategySettings {
  /** The post to generate recommendations for. */
  postId: string,
}

interface NonContextualStrategySettings {
  /** The post to generate recommendations for. */
  postId?: undefined,
}

export type StrategySettings<PostIdAvailable extends boolean> = {
  /** The post to generate recommendations for. */
  // postId?: string,
  /** Various strategy use a bias parameter in different ways for tuning - this
   *  is now mostly deprecated in favour of using features. */
  bias?: number,
  /** Weighted scoring factors for defining a recommendation algorithm. */
  features?: WeightedFeature<PostIdAvailable>[],
  /** The tag to generate recommendations (only used by some some strategies). */
  tagId?: string,
  /** Optional context string - this is not used to generate recommendations,
   *  but is stored along with the recommendation data in the database for
   *  analytics purposes. */
  context?: string,
} & (PostIdAvailable extends true ? ContextualStrategySettings : NonContextualStrategySettings)

export type StrategySpecification = ContextualStrategySpecification | NonContextualStrategySpecification | NonContextualStrategySpecificationWithPost;
// {
//   name: RecommendationStrategyName,
//   forceLoggedOutView?: boolean,
// }

export interface ContextualStrategySpecification extends StrategySettings<true> {
  name: ContextualRecommendationStrategyName,
  forceLoggedOutView?: boolean,
}

export interface NonContextualStrategySpecification extends StrategySettings<false> {
  name: NonContextualRecommendationStrategyName,
  forceLoggedOutView?: boolean,
}

interface NonContextualStrategySpecificationWithPost extends StrategySettings<true> {
  name: RecommendationStrategyName,
  forceLoggedOutView?: boolean,
}

export interface RecommendationsAlgorithmWithStrategy {
  /** The strategy to use */
  strategy: StrategySpecification,
  /** The maximum number of results to return */
  count?: number,
  /** If the selected strategy fails to generate `count` results then, by
   * default, we automatically switch to using a different strategy as a
   * fallback. Set `disableFallbacks` to true to prevent this. */
  disableFallbacks?: boolean,
}

export interface DefaultRecommendationsAlgorithm {
  method: "top"|"sample"
  count?: number
  scoreOffset: number
  scoreExponent: number
  coronavirus?: boolean
  reviewNominations?: ReviewYear
  reviewReviews?: ReviewYear
  reviewFinal?: ReviewYear,
  includePersonal?: boolean
  includeMeta?: boolean
  minimumBaseScore?: number
  excludeDefaultRecommendations?: boolean
  onlyUnread?: boolean
  lwRationalityOnly?: boolean,

  curatedModifier?: number
  frontpageModifier?: number
  personalBlogpostModifier?: number

  hideFrontpage?: boolean,
  hideContinueReading?: boolean,
  hideBookmarks?: boolean,
  hideReview?: boolean,
}

export type RecommendationsAlgorithm =
  RecommendationsAlgorithmWithStrategy |
  DefaultRecommendationsAlgorithm;

export const recommendationsAlgorithmHasStrategy = (
  algorithm: RecommendationsAlgorithm,
): algorithm is RecommendationsAlgorithmWithStrategy =>
  "strategy" in algorithm;

export const defaultAlgorithmSettings: DefaultRecommendationsAlgorithm = {
  method: "top",
  count: 10,
  scoreOffset: 0,
  scoreExponent: 3,
  personalBlogpostModifier: 0,
  includePersonal: false,
  includeMeta: false,
  frontpageModifier: 10,
  curatedModifier: 50,
  onlyUnread: true,
};

const recommendationAlgorithmSettingsSchema = new SimpleSchema({
  method: String,
  count: SimpleSchema.Integer,
  scoreOffset: Number,
  scoreExponent: Number,
  personalBlogpostModifier: Number,
  frontpageModifier: Number,
  curatedModifier: Number,
  onlyUnread: Boolean,
});

const recommendationSettingsSchema = new SimpleSchema({
  frontpage: recommendationAlgorithmSettingsSchema,
  frontpageEA: recommendationAlgorithmSettingsSchema,
  recommendationspage: recommendationAlgorithmSettingsSchema,
});

addFieldsDict(Users, {
  // Admin-only options for configuring Recommendations placement, for experimentation
  recommendationSettings: {
    type: recommendationSettingsSchema,
    blackbox: true,
    hidden: true,
    canRead: [userOwns],
    canUpdate: [userOwns],
    optional: true,
  },
});
