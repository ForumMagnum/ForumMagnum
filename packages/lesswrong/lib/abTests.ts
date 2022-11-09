import { ABTest, useABTest, useABTestProperties } from './abTestImpl';
export { useABTest, useABTestProperties };

// An A/B test which doesn't do anything (other than randomize you), for testing
// the A/B test infrastructure.
export const noEffectABTest = new ABTest({
  name: "abTestNoEffect",
  description: "A placeholder A/B test which has no effect",
  groups: {
    group1: {
      description: "The smaller test group",
      weight: 1,
    },
    group2: {
      description: "The larger test group",
      weight: 2,
    },
  }
});

// A/B test for the new CollectionsPage
export const collectionsPageABTest = new ABTest({
  name: "collectionsPageABTest",
  description: "Tests the new LargeSequencesItem on the CollectionsPage",
  groups: {
    originalLayoutGroup: {
      description: "Group with old layout (SequencesGridItem)",
      weight: 1,
    },
    largeSequenceItemGroup: {
      description: "Group using LargeSequencesItem",
      weight: 1,
    },
  }
});

// A/B test for the new BooksProgressBar
export const booksProgressBarABTest = new ABTest({
  name: "booksProgressBarABTest",
  description: "Tests the new BooksProgressBar, as used in BooksItem (itself used in CollectionsPage)",
  groups: {
    control: {
      description: "Original BooksItem without the progress bar",
      weight: 1
    },
    progressBar: {
      description: "Progress bar enabled",
      weight: 1
    }
  }
});

export const welcomeBoxABTest = new ABTest({
  name: "welcomeBoxABTest",
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
