import SimpleSchema from 'simpl-schema';
import { addFieldsDict } from '../../utils/schemaUtils';
import Users from "../users/collection";
import { userOwns } from '../../vulcan-users/permissions';
import { ReviewYear } from '../../reviewUtils';
import { TupleSet, UnionOf } from '../../utils/typeGuardUtils';

export const recommendationStrategyNames = new TupleSet([
  "moreFromAuthor",
  "moreFromTag",
  "newAndUpvotedInTag",
  "bestOf",
  "tagWeightedCollabFilter",
  "collabFilter",
  "feature",
] as const);

export const isRecommendationStrategyName =
  (name: string): name is RecommendationStrategyName =>
    recommendationStrategyNames.has(name);

export type RecommendationStrategyName = UnionOf<typeof recommendationStrategyNames>;

export const recommendationFeatureNames = new TupleSet([
  "karma",
  "curated",
  "tagSimilarity",
  "collabFilter",
  "textSimilarity",
] as const);

export const isRecommendationFeatureName =
  (name: string): name is RecommendationFeatureName =>
    recommendationFeatureNames.has(name);

export type RecommendationFeatureName = UnionOf<typeof recommendationFeatureNames>;

export type WeightedFeature = {
  feature: RecommendationFeatureName,
  weight: number,
}

export interface StrategySettings {
  /** The post to generate recommendations for. */
  postId: string,
  /** Various strategy use a bias parameter in different ways for tuning - this
   *  is now mostly deprecated in favour of using features. */
  bias?: number,
  /** Weighted scoring factors for defining a recommendation algorithm. */
  features?: WeightedFeature[],
  /** The tag to generate recommendations (only used by some some strategies). */
  tagId?: string,
  /** Optional context string - this is not used to generate recommendations,
   *  but is stored along with the recommendation data in the database for
   *  analytics purposes. */
  context?: string,
}

export interface StrategySpecification extends StrategySettings {
  name: RecommendationStrategyName,
  forceLoggedOutView?: boolean,
}

export interface RecommendationsAlgorithmWithStrategy {
  strategy: StrategySpecification,
  count?: number,
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
