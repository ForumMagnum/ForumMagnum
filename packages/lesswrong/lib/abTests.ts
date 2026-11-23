import { ABTest } from "./abTestClass";

/*
 * A/B tests, both active and finished. If an A/B test is active--that is,
 * there's some component that loads it with useABTest, or something server-side
 * that looks at it--then (1) the A/B test should be exported, (2) it should
 * have `active: true`.
 *
 * If an A/B test is inactive, then we may leave its definition around so that
 * we can figure out what A/B test group users were assigned to, but we mark it
 * inactive so that render caching isn't split based on the group.
 *
 * For example:
 *   const noEffectABTest = new ABTest({
 *     name: "abTestNoEffect",
 *     active: false,
 *     affectsLoggedOut: false,
 *     description: "A placeholder A/B test which has no effect",
 *     groups: {
 *       group1: {
 *         description: "The smaller test group",
 *         weight: 1,
 *       },
 *       group2: {
 *         description: "The larger test group",
 *         weight: 2,
 *       },
 *     }
 *   });
 */

export const twoLineEventsSidebarABTest = new ABTest({
  name: "twoLineEventsSidebar",
  active: true,
  affectsLoggedOut: true,
  description: "Events sidebar shows more information",
  groups: {
    control: {
      description: "One line per event",
      weight: 1,
    },
    expanded: {
      description: "Two lines per event",
      weight: 1,
    },
  },
});

export const frontpagePostsPagingABTest = new ABTest({
  name: "frontpagePostsPaging",
  active: true,
  affectsLoggedOut: true,
  description: "Frontpage posts list is browsed a page at a time, instead of growing with Load More",
  groups: {
    control: {
      description: "Load More adds another page of posts to the list",
      weight: 0,
    },
    paged: {
      description: "Prev and Next buttons replace the list with another page of posts",
      weight: 1,
    },
  },
});

export const allABTests = [twoLineEventsSidebarABTest, frontpagePostsPagingABTest];
