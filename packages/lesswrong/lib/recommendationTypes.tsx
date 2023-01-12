import React from 'react';
import { Components } from './vulcan-lib/components';
import keyBy from 'lodash/keyBy';


export interface PostScoringFeature<FeatureOptions> {
  getDefaultOptions: ()=>FeatureOptions
  name: string
  description: string
  optionsForm: (props: {options: FeatureOptions, setOptions: (newOptions: FeatureOptions)=>void}) => React.ReactNode
}

export interface ServerPostScoringFeature<FeatureOptions> extends PostScoringFeature<FeatureOptions> {
  scoreBatch: ((posts: DbPost[], ctx: ScoringContext, options: FeatureOptions) => Promise<number[]>)
}



export type PostScoringKarmaOptions = {exponent: number}
export class PostScoringKarma implements PostScoringFeature<PostScoringKarmaOptions> {
  name = "karma"
  description = "Karma"
  getDefaultOptions = ()=>({exponent:1})
  optionsForm = ({options, setOptions}: {options: PostScoringKarmaOptions, setOptions: (newOptions: PostScoringKarmaOptions)=>void}) => {
    return <div/>; //TODO
  }
  rescaleKarma(options: {exponent: number}, karma: number): number {
    return Math.pow(karma, options.exponent);
  }
}


export type PostScoringSimilarityOptions = {posts: Array<{postId: string, weight: number}>}
export class PostScoringSimilarity implements PostScoringFeature<PostScoringSimilarityOptions> {
  name = "similarity"
  description = "Similarity"
  getDefaultOptions = ()=>({posts: []})
  optionsForm = ({options, setOptions}: {options: PostScoringSimilarityOptions, setOptions: (newOptions: PostScoringSimilarityOptions)=>void}) => {
    const { WeightedPostsList } = Components;
    return <div>
      <div>Similar to posts:</div>
      <WeightedPostsList
        posts={options.posts}
        setPosts={(newPosts) => setOptions({posts: newPosts})}
      />
    </div>
  }
}


export type PostScoringRecentCommentsOptions = {}
export class PostScoringRecentComments implements PostScoringFeature<PostScoringRecentCommentsOptions> {
  name = "recentComments"
  description = "Has Recent Comments"
  getDefaultOptions = ()=>({})
  optionsForm = ({options, setOptions}: {options: PostScoringRecentCommentsOptions, setOptions: (newOptions: PostScoringRecentCommentsOptions)=>void}) => {
    return <div/>; //TODO
  }
}


export const scoringFeatureConstructors = [PostScoringKarma,PostScoringSimilarity,PostScoringRecentComments] as const;
export const scoringFeatures = scoringFeatureConstructors.map((Cons) => new Cons());
export const scoringFeaturesByName = keyBy(scoringFeatures, f=>f.name);

//////////////////////////////////////////////////////////////////////////////

export interface RecommendationResult {
  postId: string
  score: number
  featuresRubric: RecommendationRubric
}

export type RecommendationRubric = Array<{ feature: string, value: number }>


export type FeatureName = string;

export interface PostSamplingAlgorithm {
  features: Array<{
    name: FeatureName
    weight: number
    options: any
  }>
}

export interface RecommendationsExperimentSettings {
  date: Date|null
  outputFormat: "list"|"feed"
}

export interface RecommendationsQuery {
  overrideDate?: Date,
  limit: number
  features: Array<{
    name: FeatureName
    weight: number
    options: any
  }>
}

export interface ScoringContext {
  now: Date
  currentUser: DbUser|null
}
