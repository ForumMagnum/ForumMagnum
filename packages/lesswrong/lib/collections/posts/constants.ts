import { REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD } from '@/lib/reviewUtils';
import { viewFieldAllowAny, viewFieldNullOrMissing } from '@/lib/utils/viewConstants';

export const postStatuses = {
  STATUS_PENDING: 1, // Unused
  STATUS_APPROVED: 2,
  STATUS_REJECTED: 3,
  STATUS_SPAM: 4,
  STATUS_DELETED: 5,
}


// Post statuses
export const postStatusLabels = [
  {
    value: 1,
    label: 'pending'
  },
  {
    value: 2,
    label: 'approved'
  },
  {
    value: 3,
    label: 'rejected'
  },
  {
    value: 4,
    label: 'spam'
  },
  {
    value: 5,
    label: 'deleted'
  }
];


export const sideCommentFilterMinKarma = 10;
export const sideCommentAlwaysExcludeKarma = -1;

/**
 * @description In allPosts and elsewhere (every component that uses PostsListSettings and some
 * that use PostsList) we use the concept of filters which are like Vulcan's
 * views, but are more composable. Filters only specify selectors, and are
 * written with MongoDB query syntax.
 * To avoid duplication of code, views with the same name, will reference the
 * corresponding filter
 *
 * TODO: This should be worked to be more nicely tied in with the filterSettings
 * paradigm
 */
export const filters: Record<string,any> = {
  "curated": {
    curatedDate: {$gt: new Date(0)}
  },
  "uncurated": {
    curatedDate: viewFieldNullOrMissing
  },
  "nonSticky": {
    sticky: false,
  },
  "frontpage": {
    frontpageDate: {$gt: new Date(0)}
  },
  "all": {
    groupId: null
  },
  "questions": {
    question: true,
    hiddenRelatedQuestion: viewFieldAllowAny
  },
  "events": {
    isEvent: true,
    groupId: null
  },
  "untagged": {
    tagRelevance: {}
  },
  "unnominated2019": {
    nominationCount2019: 0
  },
  // TODO(Review) is this indexed?
  "unnominated": {
    positiveReviewVoteCount: {$lt: REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD}
  },
  "unNonCoreTagged": {
    tagRelevance: {$exists: true},
    baseScore: {$gt: 25},
    $expr: {
      $lt: [
          {$size: 
              {$filter: {
                  // this was a hack during the Tagging Sprint, where we wanted people to tag posts with non-core-tags
                  input: {$objectToArray: "$tagRelevance"},
                  cond: {$not: {$in: ["$$this.k", ["xexCWMyds6QLWognu", "sYm3HiWcfZvrGu3ui", "izp6eeJJEg9v5zcur", "fkABsGCJZ6y9qConW", "Ng8Gice9KNkncxqcj", "MfpEPj6kJneT9gWT6", "3uE2pXvbcnS9nnZRE"]]}}
              }}
          }, 
          1]
    } 
  },
  "tagged": {
    tagRelevance: {$ne: {}}
  },
  "includeMetaAndPersonal": {},
  "linkpost": {
    url: {$exists: true},
  }
}

/**
 * @summary Similar to filters (see docstring above), but specifying MongoDB-style sorts
 *
 * NB: Vulcan views overwrite sortings. If you are using a named view with a
 * sorting, do not try to supply your own.
 */
export const sortings: Record<PostSortingMode,MongoSelector<DbPost>> = {
  // filteredScore is added as a synthetic field by filterSettingsToParams
  magic: { filteredScore: -1 },
  top: { baseScore: -1 },
  topAdjusted: { karmaInflationAdjustedScore: -1 },
  new: { postedAt: -1 },
  old: { postedAt: 1 },
  recentComments: { lastCommentedAt: -1 }
}

export const MODERATION_GUIDELINES_OPTIONS = [
  {
    value: "",
    label: "No Moderation",
  },
  {
    value: "easy-going",
    label: "Easy Going - I just delete obvious spam and trolling.",
  },
  {
    value: "norm-enforcing",
    label: "Norm Enforcing - I try to enforce particular rules (see below)",
  },
  {
    value: "reign-of-terror",
    label: "Reign of Terror - I delete anything I judge to be annoying or counterproductive",
  },
];

export const EVENT_TYPES = [
  { value: "presentation", label: "Presentation" },
  { value: "discussion", label: "Discussion" },
  { value: "workshop", label: "Workshop" },
  { value: "social", label: "Social" },
  { value: "coworking", label: "Coworking" },
  { value: "course", label: "Course" },
  { value: "conference", label: "Conference" },
];

export type RsvpResponse = "yes" | "maybe" | "no";

export const responseToText: Record<RsvpResponse, string> = {
  yes: "Going",
  maybe: "Maybe",
  no: "Can't Go"
};

export const stickiedPostTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
} satisfies PostsViewTerms;

