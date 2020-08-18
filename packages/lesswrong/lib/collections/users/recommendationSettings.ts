import SimpleSchema from 'simpl-schema';
import { forumTypeSetting } from '../../instanceSettings';
import { addFieldsDict } from '../../utils/schemaUtils';
import Users from "../users/collection";

export const defaultAlgorithmSettings = {
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

export const slotSpecificRecommendationSettingDefaults = {
  frontpage: {
    count: 4
  },
  frontpageEA: {
    count: 5
  }
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
  recommendationspage: recommendationAlgorithmSettingsSchema,
  afterpost: recommendationAlgorithmSettingsSchema,
});

addFieldsDict(Users, {
  // Admin-only options for configuring Recommendations placement, for experimentation
  recommendationSettings: {
    type: recommendationSettingsSchema,
    blackbox: true,
    hidden: true,
    canRead: [Users.owns],
    canUpdate: [Users.owns],
    optional: true,
  },
});
