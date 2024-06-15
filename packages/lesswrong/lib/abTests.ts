import { ABTest, useABTest, useABTestProperties } from './abTestImpl';
import { isEAForum } from './instanceSettings';
export { useABTest, useABTestProperties };

/*
 * A/B tests, both active and finished. If an A/B test is active--that is,
 * there's some component that loads it with useABTest, or something server-side
 * that looks at it--then (1) the A/B test should be exported, (2) it should
 * have `active: true`.
 *
 * If an A/B test is inactive, then we may leave its definition around so that
 * we can figure out what A/B test group users were assigned to, but we mark it
 * inactive so that render caching isn't split based on the group.
 */

// An A/B test which doesn't do anything (other than randomize you), for testing
// the A/B test infrastructure.
const noEffectABTest = new ABTest({
  name: "abTestNoEffect",
  active: false,
  affectsLoggedOut: false,
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
const collectionsPageABTest = new ABTest({
  name: "collectionsPageABTest",
  active: false,
  affectsLoggedOut: false,
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
const booksProgressBarABTest = new ABTest({
  name: "booksProgressBarABTest",
  active: false,
  affectsLoggedOut: false,
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

export const digestPageABTest = new ABTest({
  name: "digestPage",
  active: isEAForum,
  affectsLoggedOut: true,
  description: "Which version of the digest page do we link to?",
  groups: {
    control: {
      description: "Mailchimp hosted email version",
      weight: 1,
    },
    onsite: {
      description: "On-site version",
      weight: 1,
    },
  },
});

// not active anymore since picked the best option, but leaving around as a record of AB tests that were previously run
const dialogueFacilitationMessagesABTest = new ABTest({
  name: "dialogueFacilitationMessages",
  active: false,
  affectsLoggedOut: false,
  description: "Different wording",
  groups: {
    getHelp: {
      description: "Get help version",
      weight: 1,
    },
    optIn: {
      description: "Opt-in version",
      weight: 1,
    },
  },
});

const frontpageDialogueReciprocityRecommendations = new ABTest({
  name: "frontpageDialogueReciprocityRecommendations",
  active: false,
  affectsLoggedOut: false,
  description: "Show frontpage reciprocity recommendations or not",
  groups: {
    show: {
      description: "Show on frontpage",
      weight: 1,
    },
    noShow: {
      description: "Don't show",
      weight: 1,
    },
  },
});

const showTopicsInReciprocity = new ABTest({
  name: "showOpinionsInReciprocity",
  active: false,
  affectsLoggedOut: false,
  description: "Show suggested topics in the reciprocity dialogue frontpage suggestions",
  groups: {
    show: {
      description: "Show topics",
      weight: 2,
    },
    noShow: {
      description: "Don't show topics",
      weight: 1,
    },
  },
});

// Does non-SSR rendering of the DialogueMatchingPage help with anything?
export const dialogueMatchingPageNoSSRABTest = new ABTest({
  name: "dialogueMatchingPageNoSSR",
  active: true,
  affectsLoggedOut: false,
  description: "Different rendering of the DialogueMatchingPage",
  groups: {
    control: {
      description: "Control version",
      weight: 1,
    },
    noSSR: {
      description: "Non-SSR version",
      weight: 1,
    },
  },
});

// Does showing people recommended content in the form increase conversion ratio?
export const showRecommendedContentInMatchForm = new ABTest({
  name: "showRecommendedContentInMatchForm",
  active: true,
  affectsLoggedOut: false,
  description: "Include a little card in the dialogue matchmaking form that lists a matched user's recent comments and posts, and potentially other user content",
  groups: {
    show: {
      description: "Show",
      weight: 1,
    },
    noShow: {
      description: "Don't show",
      weight: 1,
    },
  },
});

export const checkNotificationMessageContent = new ABTest({
  name: "checkNotificationMessageContent",
  active: true,
  affectsLoggedOut: false,
  description: "Send different wording of the notification message upon a user receiving new checks",
  groups: {
    v1: {
      description: "Wording version 1",
      weight: 1,
    },
    v2: {
      description: "Wording version 2",
      weight: 1,
    },
    v3: {
      description: "Wording version 3",
      weight: 1,
    },
    v4: {
      description: "Wording version 4",
      weight: 1,
    },
  },
});

export const offerToAddCalendlyLink = new ABTest({
  name: "offerToAddCalendlyLink",
  active: true,
  affectsLoggedOut: false,
  description: "Offer to add a Calendly link on dialogue match",
  groups: {
    show: {
      description: "Show field",
      weight: 2,
    },
    noShow: {
      description: "Don't show field",
      weight: 1,
    },
  },
});

export const newFrontpagePostFeedsWithRecommendationsOptIn = new ABTest({
  name: "newFrontpagePostFeedsWithRecommendationsOptIn",
  active: true,
  affectsLoggedOut: false,
  description: "New LW frontpage with multiple tabs for different post feeds",
  groups: {
    classicFrontpage: {
      description: "Control. Existing frontpage",
      weight: 1,
    },
    frontpageWithTabs: {
      description: "New frontpage with multiple tabs for different post feeds",
      weight: 0,
    },
  }
});
