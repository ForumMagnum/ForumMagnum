import SimpleSchema from 'simpl-schema';
import { addFieldsDict } from '../../utils/schemaUtils';
import Users from "../users/collection";
import { userOwns } from '../../vulcan-users/permissions';

export interface RecommendationsAlgorithm {
  method: "top"|"sample"
  count?: number
  scoreOffset: number
  scoreExponent: number
  coronavirus?: boolean
  reviewNominations?: 2018 | 2019
  reviewReviews?: 2018 | 2019
  includePersonal?: boolean
  includeMeta?: boolean
  minimumBaseScore?: number
  excludeDefaultRecommendations?: boolean
  onlyUnread?: boolean
  
  curatedModifier?: number
  frontpageModifier?: number
  personalBlogpostModifier?: number
}

export const defaultAlgorithmSettings: RecommendationsAlgorithm = {
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
