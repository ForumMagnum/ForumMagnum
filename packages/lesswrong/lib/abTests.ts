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

export const welcomeBoxABTest = new ABTest({
  name: "welcomeBoxABTest",
  active: true,
  affectsLoggedOut: true,
  description: "Tests the new Welcome Box on post pages for logged out users",
  groups: {
    control: {
      description: "Don't show Welcome Box on post pages",
      weight: 1
    },
    welcomeBox: {
      description: "Show Welcome Box on post pages",
      weight: 1
    }
  }
});

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

export const ultraFeedABTest = new ABTest({
  name: "ultraFeed",
  active: true,
  affectsLoggedOut: false,
  description: "Tests the new UltraFeed vs classic Recent Discussion Feed for logged-in users",
  groups: {
    control: {
      description: "Show classic feed (Recent Discussion)",
      weight: 1
    },
    ultraFeed: {
      description: "Show the New Feed",
      weight: 1
    }
  }
});

export const allABTests = [welcomeBoxABTest, twoLineEventsSidebarABTest, ultraFeedABTest];
