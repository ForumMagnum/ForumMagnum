import { ABTest, useABTest, useABTestProperties } from './abTestImpl';
export { useABTest, useABTestProperties };

export const reviewWidgetABTest = new ABTest({
  name: "abTestReviewWidget",
  description: "A/B test for the review widget review preview",
  groups: {
    inlineComment: {
      description: "single line comment test group",
      weight: 1,
    },
    postTitle: {
      description: "post title test group",
      weight: 1,
    },
  }
});
