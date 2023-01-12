import React from 'react';
import { Components } from './vulcan-lib/components';
import Input from '@material-ui/core/Input';
import keyBy from 'lodash/keyBy';


export class PostScoringFeature<FeatureOptions> {
  getDefaultOptions: ()=>FeatureOptions
  name: string
  description: string
  scoreMode: "additive"|"multiplicative" = "additive"
  optionsForm: (props: {options: FeatureOptions, setOptions: (newOptions: FeatureOptions)=>void}) => React.ReactNode
}

export interface ServerPostScoringFeature<FeatureOptions> extends PostScoringFeature<FeatureOptions> {
  scoreBatch: ((posts: DbPost[], ctx: ScoringContext, options: FeatureOptions) => Promise<number[]>)
}



export type PostScoringKarmaOptions = {exponent: number}
export class PostScoringKarma extends PostScoringFeature<PostScoringKarmaOptions> {
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

export type PostScoringTimeDecayOptions = {ageOffset: number, exponent: number}
export class PostScoringTimeDecay extends PostScoringFeature<PostScoringTimeDecayOptions> {
  name = "timeDecay"
  description = "Time Decay"
  scoreMode = "multiplicative" as const
  getDefaultOptions = ()=>({ageOffset: 2.0, exponent:1.15})
  optionsForm = ({options, setOptions}: {options: PostScoringTimeDecayOptions, setOptions: (newOptions: PostScoringTimeDecayOptions)=>void}) => {
    return <div>
      <div>
        Offset
        <Input
          value={options.ageOffset}
          onChange={(e) => setOptions({...options, ageOffset: parseFloat(e.target.value)})}
        />
      </div>
      <div>
        Exponent
        <Input
          value={options.exponent}
          onChange={(e) => setOptions({...options, exponent: parseFloat(e.target.value)})}
        />
      </div>
    </div>
  }
}

export type PostScoringSimilarityOptions = {posts: Array<{postId: string, weight: number}>}
export class PostScoringSimilarity extends PostScoringFeature<PostScoringSimilarityOptions> {
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
export class PostScoringRecentComments extends PostScoringFeature<PostScoringRecentCommentsOptions> {
  name = "recentComments"
  description = "Has Recent Comments"
  getDefaultOptions = ()=>({})
  optionsForm = ({options, setOptions}: {options: PostScoringRecentCommentsOptions, setOptions: (newOptions: PostScoringRecentCommentsOptions)=>void}) => {
    return <div/>; //TODO
  }
}


export const scoringFeatureConstructors = [PostScoringKarma,PostScoringTimeDecay,PostScoringSimilarity,PostScoringRecentComments] as const;
export const scoringFeatures = scoringFeatureConstructors.map((Cons) => new Cons());
export const scoringFeaturesByName = keyBy(scoringFeatures, f=>f.name);

//////////////////////////////////////////////////////////////////////////////

export interface RecommendationResult {
  postId: string
  score: number
  featuresRubric: RecommendationRubric
}

export type RecommendationRubric = Array<{
  feature: string,
  mode: "additive"|"multiplicative",
  value: number,
}>


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
  perspective: "myself"|"loggedOut"
  limit: number
}

export interface RecommendationsQuery {
  overrideDate?: string,
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
