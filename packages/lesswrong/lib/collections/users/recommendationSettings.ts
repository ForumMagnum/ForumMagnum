import SimpleSchema from 'simpl-schema';
import { userOwns } from '../../vulcan-users/permissions';
import { ReviewYear } from '../../reviewUtils';
import { TupleSet, UnionOf } from '../../utils/typeGuardUtils';
import type { FilterSettings } from '@/lib/filterSettings';

export const recommendationStrategyNames = new TupleSet([
  "moreFromAuthor",
  "moreFromTag",
  "newAndUpvotedInTag",
  "bestOf",
  "wrapped",
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
  /** Target year for the EA Forum wrapped strategy */
  year?: number,
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

export interface HybridArmsConfig {
  fixed: string,
  configurable: string,
}

export interface RecombeeConfiguration {
  userId?: string,
  rotationRate?: number,
  rotationTime?: number,
  booster?: string,
  filter?: string,
  hybridScenarios?: HybridArmsConfig,
  refreshKey?: string,
  loadMore?: {
    prevRecommId?: string,
  },
  excludedPostIds?: string[],
  filterSettings?: FilterSettings,
}

export interface RecombeeRecommendationArgs extends RecombeeConfiguration {
  // Note: these filters will not obviously be functional, check current implementation to see if used successfully
  onlyUnread?: boolean,
  lwRationalityOnly?: boolean,
  scenario: string,
  filterSettings?: FilterSettings,
  skipTopOfListPosts?: boolean,
}

export interface HybridRecombeeConfiguration {
  hybridScenarios: HybridArmsConfig,
  userId?: string,
  rotationRate?: number,
  rotationTime?: number,
  booster?: string,
  refreshKey?: string,
  loadMore?: {
    prevRecommIds: [string | undefined, string | undefined],
    loadMoreCount?: number,
  },
  excludedPostIds?: string[],
  filterSettings?: FilterSettings,
}

export interface VertexConfiguration {
  loadMore?: {
    prevAttributionId: string,
  },
}


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

export const recommendationSettingsSchema = new SimpleSchema({
  frontpage: recommendationAlgorithmSettingsSchema,
  frontpageEA: recommendationAlgorithmSettingsSchema,
  recommendationspage: recommendationAlgorithmSettingsSchema,
});

