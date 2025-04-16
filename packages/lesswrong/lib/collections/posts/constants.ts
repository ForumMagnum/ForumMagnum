import React from 'react';
import { annualReviewAnnouncementPostPathSetting, DatabasePublicSetting } from "../../publicSettings";
import QuestionAnswerIcon from '@/lib/vendor/@material-ui/icons/src/QuestionAnswer';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';
import AllInclusiveIcon from '@/lib/vendor/@material-ui/icons/src/AllInclusive';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import { isEAForum } from '../../instanceSettings';
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

const amaTagIdSetting = new DatabasePublicSetting<string | null>('amaTagId', null)
export const openThreadTagIdSetting = new DatabasePublicSetting<string>('openThreadTagId', 'eTLv8KzwBGcDip9Wi')
export const startHerePostIdSetting = new DatabasePublicSetting<string | null>('startHerePostId', null)

// Cute hack
const reviewPostIdSetting = {
  get: () => isEAForum ?
    annualReviewAnnouncementPostPathSetting.get()?.match(/^\/posts\/([a-zA-Z\d]+)/)?.[1] :
    null
}

export const tagSettingIcons = new Map<DatabasePublicSetting<string | null>, React.ComponentType<React.SVGProps<SVGElement>>>([
  [amaTagIdSetting, QuestionAnswerIcon], 
  [openThreadTagIdSetting, AllInclusiveIcon],
]);

export const idSettingIcons = new Map([
  [startHerePostIdSetting, ArrowForwardIcon],
  // use an imposter to avoid duplicating annualReviewAnnouncementPostPathSetting, which is a path not a post id
  [reviewPostIdSetting as DatabasePublicSetting<string | null>, StarIcon]
]);

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

export const TOS_NOT_ACCEPTED_ERROR = 'You must accept the terms of use before you can publish this post';
export const TOS_NOT_ACCEPTED_REMOTE_ERROR = 'You must read and accept the Terms of Use on the EA Forum in order to crosspost.  To do so, go to https://forum.effectivealtruism.org/newPost and accept the Terms of Use presented above the draft post.';
