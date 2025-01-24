import moment from 'moment';
import { getKarmaInflationSeries, timeSeriesIndexExpr } from './karmaInflation';
import { combineIndexWithDefaultViewIndex, ensureIndex, ensureCustomPgIndex } from '../../collectionIndexUtils';
import type { FilterMode, FilterSettings, FilterTag } from '../../filterSettings';
import { isAF, isEAForum } from '../../instanceSettings';
import { defaultVisibilityTags } from '../../publicSettings';
import { frontpageTimeDecayExpr, postScoreModifiers, timeDecayExpr } from '../../scoring';
import { viewFieldAllowAny, viewFieldNullOrMissing } from '../../vulcan-lib';
import { Posts } from './collection';
import { postStatuses, startHerePostIdSetting } from './constants';
import uniq from 'lodash/uniq';
import { getPositiveVoteThreshold, QUICK_REVIEW_SCORE_THRESHOLD, ReviewPhase, REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD, VOTING_PHASE_REVIEW_THRESHOLD, longformReviewTagId } from '../../reviewUtils';
import { jsonArrayContainsSelector } from '../../utils/viewUtils';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../tags/collection';
import { filter, isEmpty, pick } from 'underscore';
import { visitorGetsDynamicFrontpage } from '../../betas';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';

export const DEFAULT_LOW_KARMA_THRESHOLD = -10
export const MAX_LOW_KARMA_THRESHOLD = -1000

const eventBuffer = isEAForum
  ? { startBuffer: 1, endBuffer: null }
  : { startBuffer: 6, endBuffer: 3 };

export const POST_SORTING_MODES = new TupleSet([
  "magic", "top", "topAdjusted", "new", "old", "recentComments"
] as const);

type ReviewSortings = "fewestReviews"|"mostReviews"|"lastCommentedAt"

declare global {
  interface PostsViewTerms extends ViewTermsBase {
    view?: PostsViewName,
    includeRelatedQuestions?: "true"|"false",
    karmaThreshold?: number|string,
    meta?: boolean,
    userId?: string,
    filter?: any,
    filters?: any,
    filterSettings?: any,
    sortBy?: ReviewSortings,
    sortByMost?: boolean,
    sortedBy?: PostSortingModeWithRelevanceOption,
    af?: boolean,
    excludeEvents?: boolean,
    onlineEvent?: boolean,
    globalEvent?: boolean,
    eventType?: Array<string>,
    groupId?: string,
    lat?: number,
    lng?: number,
    slug?: string,
    sortDraftsBy?: string,
    forum?: boolean,
    question?: boolean,
    tagId?: string,
    subforumTagId?: string,
    legacyId?: string,
    postId?: string,
    authorIsUnreviewed?: boolean|null,
    before?: Date|string|null,
    after?: Date|string|null,
    curatedAfter?: Date|string|null,
    timeField?: keyof DbPost,
    postIds?: Array<string>,
    notPostIds?: Array<string>,
    reviewYear?: number,
    reviewPhase?: ReviewPhase,
    excludeContents?: boolean,
    includeArchived?: boolean,
    includeDraftEvents?: boolean,
    includeShared?: boolean,
    hideCommunity?: boolean,
    distance?: number,
    audioOnly?: boolean,
    // BEGIN overrides for parameters in the frontpageTimeDecayExpr
    algoStartingAgeHours?: number
    algoDecayFactorSlowest?: number
    algoDecayFactorFastest?: number
    /** Will be used in favour of activityHalfLifeHours and activityWeight if provided */
    algoActivityFactor?: number
    algoActivityHalfLifeHours?: number
    algoActivityWeight?: number
    requiredUnnominated?: boolean,
    requiredFrontpage?: boolean,
    // END
  }
  type PostSortingMode = UnionOf<typeof POST_SORTING_MODES>;
  type PostSortingModeWithRelevanceOption = PostSortingMode|"relevance"
}

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

/**
 * @summary Base parameters that will be common to all other view unless specific properties are overwritten
 *
 * When changing this, also update getViewablePostsSelector.
 *
 * NB: Specifying "before" into posts views is a bit of a misnomer at present,
 * as it is *inclusive*. The parameters callback that handles it outputs
 * ~ $lt: before.endOf('day').
 */
Posts.addDefaultView((terms: PostsViewTerms, _, context?: ResolverContext) => {
  const validFields: any = pick(terms, 'userId', 'groupId', 'af','question', 'authorIsUnreviewed');
  // Also valid fields: before, after, curatedAfter, timeField (select on postedAt), excludeEvents, and
  // karmaThreshold (selects on baseScore).

  const postCommentedExcludeCommunity = {$or: [
    {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$lt: 1}},
    {[`tagRelevance.${EA_FORUM_COMMUNITY_TOPIC_ID}`]: {$exists: false}},
  ]}

  const alignmentForum = isAF ? {af: true} : {}
  let params: any = {
    selector: {
      status: postStatuses.STATUS_APPROVED,
      draft: false,
      isFuture: false,
      unlisted: false,
      shortform: false,
      authorIsUnreviewed: false,
      rejected: { $ne: true },
      hiddenRelatedQuestion: false,
      groupId: viewFieldNullOrMissing,
      ...(terms.postIds && {_id: {$in: terms.postIds}}),
      ...(terms.notPostIds && {_id: {$nin: terms.notPostIds}}),
      ...(terms.hideCommunity ? postCommentedExcludeCommunity : {}),
      ...validFields,
      ...alignmentForum
    },
    options: {},
  }
  // TODO: Use default threshold in default view
  // TODO: Looks like a bug in cases where karmaThreshold = 0, because we'd
  // still want to filter.
  if (terms.karmaThreshold && terms.karmaThreshold !== "0") {
    params.selector.baseScore = {$gte: parseInt(terms.karmaThreshold+"", 10)}
    params.selector.maxBaseScore = {$gte: parseInt(terms.karmaThreshold+"", 10)}
  }
  if (terms.excludeEvents) {
    params.selector.isEvent = false
  }
  if (terms.userId) {
    params.selector.hideAuthor = false
  }
  if (terms.includeRelatedQuestions === "true") {
    params.selector.hiddenRelatedQuestion = viewFieldAllowAny
  }
  if (terms.filter) {
    if (filters[terms.filter]) {
      params.selector = {...params.selector, ...filters[terms.filter]}
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `Filter '${terms.filter}' not recognized while constructing defaultView`,
        terms.view ? ` for view ${terms.view}` : ''
      )
    }
  }
  if (terms.filterSettings) {
    const filterParams = filterSettingsToParams(terms.filterSettings, terms, context);
    params = {
      selector: { ...params.selector, ...filterParams.selector },
      options: { ...params.options, ...filterParams.options },
      syntheticFields: { ...params.syntheticFields, ...filterParams.syntheticFields },
    };
  } else {
    // The "magic" sorting needs a `filteredScore` to use when ordering. This
    // is normally filled in using the filter settings, but we need to just
    // copy over the normal score when filter settings are not supplied.
    params.syntheticFields = {
      ...params.syntheticFields,
      filteredScore: "$score",
    };
  }
  if (terms.sortedBy) {
    if (terms.sortedBy === 'topAdjusted') {
      params.syntheticFields = { ...params.syntheticFields, ...buildInflationAdjustedField() }
    }

    if ((sortings as AnyBecauseTodo)[terms.sortedBy]) {
      params.options = {sort: {...params.options.sort, ...(sortings as AnyBecauseTodo)[terms.sortedBy]}}
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `Sorting '${terms.sortedBy}' not recognized while constructing defaultView`,
        terms.view ? ` for view ${terms.view}` : ''
      )
    }
  }
  
  if (terms.after || terms.before) {
    let postedAt: any = {};

    if (terms.after) {
      postedAt.$gte = moment(terms.after).toDate();
    }
    if (terms.before) {
      postedAt.$lt = moment(terms.before).toDate();
    }

    if (!isEmpty(postedAt) && !terms.timeField) {
      params.selector.postedAt = postedAt;
    } else if (!isEmpty(postedAt) && terms.timeField) {
      params.selector[terms.timeField] = postedAt;
    }
  }
  if (terms.curatedAfter) {
    params.selector.curatedDate = {$gte: moment(terms.curatedAfter).toDate()}
  }
  
  return params;
})

const getFrontpageFilter = (filterSettings: FilterSettings): {filter: any, softFilter: Array<any>} => {
  if (filterSettings.personalBlog === "Hidden") {
    return {
      filter: {frontpageDate: {$gt: new Date(0)}},
      softFilter: []
    }
  } else if (filterSettings.personalBlog === "Required") {
    return {
      filter: {frontpageDate: viewFieldNullOrMissing},
      softFilter: []
    }
  } else {
    const personalBonus = filterModeToAdditiveKarmaModifier(filterSettings.personalBlog)
    return {
      filter: {},
      softFilter: personalBonus ? [
        {
          $cond: {
            if: "$frontpageDate",
            then: 0,
            else: personalBonus
          }
        },
      ] : []
    }
  }
}

export function buildInflationAdjustedField(): any {
  const karmaInflationSeries = getKarmaInflationSeries();
  return {
    karmaInflationAdjustedScore: {
      $multiply: [
        "$baseScore",
        {
          $ifNull: [
            {
              $arrayElemAt: [
                karmaInflationSeries.values,
                {
                  $max: [
                    timeSeriesIndexExpr("$postedAt", karmaInflationSeries.start, karmaInflationSeries.interval),
                    0 // fall back to first value if out of range
                  ]
                }]
            },
            karmaInflationSeries.values[karmaInflationSeries.values.length - 1] // fall back to final value if out of range
          ]
        }
      ]
    }
  }
}

function filterSettingsToParams(filterSettings: FilterSettings, terms: PostsViewTerms, context?: ResolverContext): any {
  // We get the default tag relevance from the database config
  const tagFilterSettingsWithDefaults: FilterTag[] = filterSettings.tags.map(t =>
    t.filterMode === "TagDefault" ? {
      tagId: t.tagId,
      tagName: t.tagName,
      filterMode: defaultVisibilityTags.get().find(dft => dft.tagId === t.tagId)?.filterMode || 'Default',
    } :
    t
  )
  const tagsRequired = filter(tagFilterSettingsWithDefaults, t=>t.filterMode==="Required");
  const tagsExcluded = filter(tagFilterSettingsWithDefaults, t=>t.filterMode==="Hidden");
  
  const frontpageFiltering = getFrontpageFilter(filterSettings)
  
  const {filter: frontpageFilter, softFilter: frontpageSoftFilter} = frontpageFiltering
  let tagsFilter = {};
  const tagFilters: any[] = [];
  for (let tag of tagsRequired) {
    tagFilters.push({[`tagRelevance.${tag.tagId}`]: {$gte: 1}});
  }
  for (let tag of tagsExcluded) {
    tagFilters.push({$or: [
      {[`tagRelevance.${tag.tagId}`]: {$lt: 1}},
      {[`tagRelevance.${tag.tagId}`]: {$exists: false}},
    ]});
  }
  
  const tagsSoftFiltered = tagFilterSettingsWithDefaults.filter(
    t => (t.filterMode!=="Hidden" && t.filterMode!=="Required" && t.filterMode!=="Default" && t.filterMode!==0)
  );

  const useSlowerFrontpage = !!context && ((!!context.currentUser && isEAForum) || visitorGetsDynamicFrontpage(context.currentUser ?? null));

  const syntheticFields = {
    filteredScore: {$divide:[
      {$multiply: [
        {$add:[
          "$baseScore",
          ...tagsSoftFiltered.map(t => (
            {$cond: {
              if: {$gt: ["$tagRelevance."+t.tagId, 0]},
              then: filterModeToAdditiveKarmaModifier(t.filterMode),
              else: 0
            }}
          )),
          ...postScoreModifiers(),
          ...frontpageSoftFilter,
        ]},
        ...tagsSoftFiltered.map(t => (
          {$cond: {
            if: {$gt: ["$tagRelevance."+t.tagId, 0]},
            then: filterModeToMultiplicativeKarmaModifier(t.filterMode),
            else: 1
          }}
        )),
      ]},
      useSlowerFrontpage ? frontpageTimeDecayExpr({
        startingAgeHours: terms.algoStartingAgeHours,
        decayFactorSlowest: terms.algoDecayFactorSlowest,
        decayFactorFastest: terms.algoDecayFactorFastest,
        activityHalfLifeHours: terms.algoActivityHalfLifeHours,
        activityWeight: terms.algoActivityWeight,
        overrideActivityFactor: terms.algoActivityFactor,
      }, context) : timeDecayExpr()
    ]}
  }
  
  return {
    selector: {
      ...frontpageFilter,
      ...(tagFilters.length ? {$and: tagFilters} : {}),
    },
    syntheticFields,
  };
}

function filterModeToAdditiveKarmaModifier(mode: FilterMode): number {
  if (typeof mode === "number" && (mode <= 0 || 1 <= mode)) {
    return mode;
  } else switch(mode) {
    default:
    case "Default": return 0;
    case "Subscribed": return 25;
  }
}

function filterModeToMultiplicativeKarmaModifier(mode: FilterMode): number {
  // Example: "x10.0" is a multiplier of 10
  const match = typeof mode === "string" && mode.match(/^x(\d+(?:\.\d+)?)$/);
  if (match) {
    return parseFloat(match[1]);
  } else if (typeof mode === "number" && 0 < mode && mode < 1) {
    return mode;
  } else {
    switch(mode) {
      default:
      case "Default": return 1;
      case "Reduced": return 0.5;
    }
  }
}

export function augmentForDefaultView(indexFields: MongoIndexKeyObj<DbPost>)
{
  return combineIndexWithDefaultViewIndex({
    viewFields: indexFields,
    prefix: {status:1, isFuture:1, draft:1, unlisted:1, shortform: 1, hiddenRelatedQuestion:1, authorIsUnreviewed:1, groupId:1},
    suffix: { _id:1, meta:1, isEvent:1, af:1, frontpageDate:1, curatedDate:1, postedAt:1, baseScore:1 },
  });
}


/**
 * @summary User posts view
 */

Posts.addView("userPosts", (terms: PostsViewTerms) => {
  const sortOverride = terms.sortedBy ? {} : {sort: {postedAt: -1}}
  return {
    selector: {
      userId: viewFieldAllowAny,
      hiddenRelatedQuestion: viewFieldAllowAny,
      shortform: viewFieldAllowAny,
      groupId: null, // TODO: fix vulcan so it doesn't do deep merges on viewFieldAllowAny
      $or: [{userId: terms.userId}, {"coauthorStatuses.userId": terms.userId}],
      rejected: null
    },
    options: {
      limit: 5,
      ...sortOverride
    }
  }
});
// This index is currently unused on LW.
// ensureIndex(Posts,
//   augmentForDefaultView({ userId: 1, hideAuthor: 1, postedAt: -1, }),
//   {
//     name: "posts.userId_postedAt",
//   }
// );
ensureIndex(Posts,
  augmentForDefaultView({ 'coauthorStatuses.userId': 1, userId: 1, postedAt: -1 }),
  {
    name: "posts.coauthorStatuses_postedAt",
  }
);

const setStickies = (sortOptions: MongoSort<DbPost>, terms: PostsViewTerms): MongoSort<DbPost> => {
  if (terms.af && terms.forum) {
    return { afSticky: -1, stickyPriority: -1, ...sortOptions}
  } else if (terms.meta && terms.forum) {
    return { metaSticky: -1, stickyPriority: -1, ...sortOptions}
  } else if (terms.forum) {
    return { sticky: -1, stickyPriority: -1, ...sortOptions}
  }
  return sortOptions
}

const stickiesIndexPrefix = {
  sticky: -1, afSticky: -1, metaSticky: -1, stickyPriority: -1
};


Posts.addView("magic", (terms: PostsViewTerms) => {
  let selector = { isEvent: false };
  if (isEAForum) {
    selector = {
      ...selector,
      ...filters.nonSticky,
    };
  }
  return {
    selector,
    options: {sort: setStickies(sortings.magic, terms)},
  };
});
ensureIndex(Posts,
  augmentForDefaultView({ score:-1, isEvent: 1 }),
  {
    name: "posts.score",
  }
);


// Wildcard index on tagRelevance, enables us to efficiently filter on tagRel scores
ensureIndex(Posts,{ "tagRelevance.$**" : 1 } )
// This index doesn't appear used, but seems like it should be.
// ensureIndex(Posts,
//   augmentForDefaultView({ afSticky:-1, score:-1 }),
//   {
//     name: "posts.afSticky_score",
//   }
// );


Posts.addView("top", (terms: PostsViewTerms) => ({
  options: {sort: setStickies(sortings.top, terms)}
}))
// unused on LW. If EA forum is also not using we can delete.
// ensureIndex(Posts,
//   augmentForDefaultView({ ...stickiesIndexPrefix, baseScore:-1 }),
//   {
//     name: "posts.stickies_baseScore",
//   }
// );
// ensureIndex(Posts,
//   augmentForDefaultView({ userId: 1, hideAuthor: 1, ...stickiesIndexPrefix, baseScore:-1 }),
//   {
//     name: "posts.userId_stickies_baseScore",
//   }
// );

// Used by "topAdjusted" sort
ensureIndex(Posts,
  augmentForDefaultView({ postedAt: 1, baseScore: 1, maxBaseScore: 1 }),
  {
    name: "posts.sort_by_topAdjusted",
    partialFilterExpression: {
      status: postStatuses.STATUS_APPROVED,
      draft: false,
      unlisted: false,
      isFuture: false,
      shortform: false,
      authorIsUnreviewed: false,
      hiddenRelatedQuestion: false,
      isEvent: false,
    },
  }
);

Posts.addView("new", (terms: PostsViewTerms) => ({
  options: {sort: setStickies(sortings.new, terms)}
}))

Posts.addView("recentComments", (terms: PostsViewTerms) => ({
  options: {sort: sortings.recentComments}
}))

Posts.addView("old", (terms: PostsViewTerms) => ({
  options: {sort: sortings.old}
}))
// Covered by the same index as `new`

Posts.addView("timeframe", (terms: PostsViewTerms) => ({
  options: {limit: terms.limit}
}))
ensureIndex(Posts,
  augmentForDefaultView({ postedAt:1, baseScore:1}),
  {
    name: "posts.postedAt_baseScore",
  }
);

Posts.addView("daily", (terms: PostsViewTerms) => ({
  options: {
    sort: {baseScore: -1}
  }
}));

Posts.addView("tagRelevance", ({ sortedBy, tagId }: PostsViewTerms) => ({
  // note: this relies on the selector filtering done in the default view
  // sorts by the "sortedBy" parameter if it's been passed in, or otherwise sorts by tag relevance
  options: {
    sort: sortedBy && sortedBy !== "relevance"
      ? sortings[sortedBy]
      : { [`tagRelevance.${tagId}`]: -1, baseScore: -1 },
  }
}));

Posts.addView("frontpage", (terms: PostsViewTerms) => ({
  selector: filters.frontpage,
  options: {
    sort: {sticky: -1, stickyPriority: -1, score: -1}
  }
}));
ensureIndex(Posts,
  augmentForDefaultView({ sticky: -1, stickyPriority: -1, score: -1, frontpageDate:1 }),
  {
    name: "posts.frontpage",
    partialFilterExpression: filters.frontpage,
  }
);

Posts.addView("frontpage-rss", (terms: PostsViewTerms) => ({
  selector: filters.frontpage,
  options: {
    sort: {frontpageDate: -1, postedAt: -1}
  }
}));
// Covered by the same index as `frontpage`

Posts.addView("curated", (terms: PostsViewTerms) => ({
  selector: filters.curated,
  options: {
    sort: {sticky: -1, curatedDate: -1, postedAt: -1}
  }
}));
ensureIndex(Posts,
  augmentForDefaultView({ sticky:-1, curatedDate:-1, postedAt:-1 }),
  {
    name: "posts.curated",
    partialFilterExpression: { curatedDate: {$gt: new Date(0)} },
  }
);

Posts.addView("curated-rss", (terms: PostsViewTerms) => ({
  selector: {
    curatedDate: {$gt: new Date(0)},
  },
  options: {
    sort: {curatedDate: -1, postedAt: -1}
  }
}));
// Covered by the same index as `curated`

Posts.addView("community", (terms: PostsViewTerms) => ({
  selector: {
    frontpageDatgroupId: { $exists: false },
    isEvent: false,
  },
  options: {
    sort: {sticky: -1, score: -1}
  }
}));
ensureIndex(Posts,
  augmentForDefaultView({ sticky: -1, score: -1 }),
  {
    name: "posts.community",
  }
);


Posts.addView("community-rss", (terms: PostsViewTerms) => ({
  selector: {
    frontpageDate: null,
    maxBaseScore: {$gt: 2}
  },
  options: {
    sort: {postedAt: -1}
  }
}));
// Covered by the same index as `new`

Posts.addView("meta-rss", (terms: PostsViewTerms) => ({
  selector: {
    meta: true,
  },
  options: {
    sort: {
      postedAt: -1
    }
  }
}))
// Covered by the same index as `new`

Posts.addView('rss', Posts.views['community-rss']); // default to 'community-rss' for rss


Posts.addView("topQuestions", (terms: PostsViewTerms) => ({
  selector: {
    question: true,
    hiddenRelatedQuestion: viewFieldAllowAny,
    baseScore: {$gte: 40}
  },
  options: {
    sort: { lastCommentedAt: -1 }
  }
}));
ensureIndex(Posts,
  augmentForDefaultView({ question:1, lastCommentedAt: -1 }),
  {
    name: "posts.topQuestions",
  }
);

Posts.addView("recentQuestionActivity", (terms: PostsViewTerms) => ({
  selector: {
    question: true,
    hiddenRelatedQuestion: viewFieldAllowAny,
  },
  options: {
    sort: {lastCommentedAt: -1}
  }
}));
// covered by same index as 'topQuestions'

/**
 * @summary Scheduled view
 */
Posts.addView("scheduled", (terms: PostsViewTerms) => ({
  selector: {
    status: postStatuses.STATUS_APPROVED,
    isFuture: true
  },
  options: {
    sort: {postedAt: -1}
  }
}));
// Covered by the same index as `new`

Posts.addView("rejected", (terms: PostsViewTerms) => ({
  selector: {
    rejected: true,
    authorIsUnreviewed: null
  },
  options: {
    sort: {postedAt: -1}
  }
}));
ensureIndex(Posts, augmentForDefaultView({ rejected: -1, authorIsUnreviewed:1, postedAt: -1 }));

/**
 * @summary Draft view
 */
Posts.addView("drafts", (terms: PostsViewTerms) => {
  let query: any = {
    selector: {
      userId: viewFieldAllowAny,
      $or: [
        {userId: terms.userId},
        {shareWithUsers: terms.userId},
        {"coauthorStatuses.userId": terms.userId},
      ],
      draft: true,
      hideAuthor: false,
      unlisted: null,
      groupId: null, // TODO: fix vulcan so it doesn't do deep merges on viewFieldAllowAny
      authorIsUnreviewed: viewFieldAllowAny,
      hiddenRelatedQuestion: viewFieldAllowAny,
      deletedDraft: false,
    },
    options: {
      sort: {}
    }
  }
  
  if (terms.includeDraftEvents) {
    query.selector.isEvent = viewFieldAllowAny
  }
  if (terms.includeArchived) {
    query.selector.deletedDraft = viewFieldAllowAny
  }
  if (!terms.includeShared) {
    query.selector.userId = terms.userId
  }
  if (terms.userId) {
    query.selector.hideAuthor = false
  }
  
  switch (terms.sortDraftsBy) {
    case 'wordCountAscending': {
      // FIXME: This should have "contents.wordCount": 1, but that crashes
      query.options.sort = {modifiedAt: -1, createdAt: -1}
      break
    }
    case 'wordCountDescending': {
      // FIXME: This should have "contents.wordCount": -1, but that crashes
      query.options.sort = {modifiedAt: -1, createdAt: -1}
      break
    }
    case 'lastModified': {
      query.options.sort = {modifiedAt: -1, createdAt: -1}
      break
    }
    case 'newest': {
      query.options.sort = {createdAt: -1, modifiedAt: -1}
      break
    }
    default: {
      query.options.sort = {modifiedAt: -1, createdAt: -1}
    }
  }
  return query
});

// not currently used, but seems like it should be?
// ensureIndex(Posts,
//   augmentForDefaultView({ wordCount: 1, userId: 1, hideAuthor: 1, deletedDraft: 1, modifiedAt: -1, createdAt: -1 }),
//   { name: "posts.userId_wordCount" }
// );
ensureIndex(Posts,
  augmentForDefaultView({ userId: 1, hideAuthor: 1, deletedDraft: 1, modifiedAt: -1, createdAt: -1 }),
  { name: "posts.userId_createdAt" }
);
ensureIndex(Posts,
  augmentForDefaultView({ shareWithUsers: 1, deletedDraft: 1, modifiedAt: -1, createdAt: -1 }),
  { name: "posts.userId_shareWithUsers" }
);

/**
 * @summary All drafts view
 */
Posts.addView("all_drafts", (terms: PostsViewTerms) => ({
  selector: {
    draft: true
  },
  options: {
    sort: {createdAt: -1}
  }
}));

Posts.addView("unlisted", (terms: PostsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      unlisted: true,
      groupId: null,
    },
    options: {
      sort: {createdAt: -1}
    }
}});

Posts.addView("userAFSubmissions", (terms: PostsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      af: false,
      suggestForAlignmentUserIds: terms.userId,
    },
    options: {
      sort: {createdAt: -1}
    }
  }});

Posts.addView("slugPost", (terms: PostsViewTerms) => ({
  selector: {
    slug: terms.slug,
  },
  options: {
    limit: 1,
  }
}));
ensureIndex(Posts, {"slug": "hashed"});

Posts.addView("legacyIdPost", (terms: PostsViewTerms) => {
  if (!terms.legacyId) throw new Error("Missing view argument: legacyId");
  const legacyId = parseInt(terms.legacyId, 36)
  if (isNaN(legacyId)) throw new Error("Invalid view argument: legacyId must be base36, was "+terms.legacyId);
  return {
    selector: {
      legacyId: ""+legacyId,
      af: viewFieldAllowAny,
    },
    options: {
      limit: 1
    }
  }
});
ensureIndex(Posts, {legacyId: "hashed"});


// Corresponds to the postCommented subquery in recentDiscussionFeed.ts
const postCommentedViewFields = {
  status: 1,
  isFuture: 1,
  draft: 1,
  unlisted: 1,
  authorIsUnreviewed: 1,
  hideFrontpageComments: 1,
  
  lastCommentedAt: -1,
  _id: 1,
  
  baseScore: 1,
  af: 1,
  isEvent: 1,
  globalEvent: 1,
  commentCount: 1,
}
ensureIndex(Posts, postCommentedViewFields);

const recentDiscussionFilter = {
  baseScore: {$gt:0},
  hideFrontpageComments: false,
  hiddenRelatedQuestion: viewFieldAllowAny,
  shortform: viewFieldAllowAny,
  groupId: null,
}
Posts.addView("recentDiscussionThreadsList", (terms: PostsViewTerms) => {
  return {
    selector: {
      ...recentDiscussionFilter
    },
    options: {
      sort: {lastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ lastCommentedAt:-1, baseScore:1, hideFrontpageComments:1 }),
  { name: "posts.recentDiscussionThreadsList", }
);

Posts.addView("afRecentDiscussionThreadsList", (terms: PostsViewTerms) => {
  return {
    selector: {
      ...recentDiscussionFilter
    },
    options: {
      sort: {afLastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
// this index appears unused
// ensureIndex(Posts,
//   augmentForDefaultView({ hideFrontpageComments:1, afLastCommentedAt:-1, baseScore:1 }),
//   { name: "posts.afRecentDiscussionThreadsList", }
// );

Posts.addView("2018reviewRecentDiscussionThreadsList", (terms: PostsViewTerms) => {
  return {
    selector: {
      ...recentDiscussionFilter,
      nominationCount2018: { $gt: 0 }
    },
    options: {
      sort: {lastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
// ensureIndex(Posts,
//   augmentForDefaultView({ nominationCount2018: 1, lastCommentedAt:-1, baseScore:1, hideFrontpageComments:1 }),
//   { name: "posts.2018reviewRecentDiscussionThreadsList", }
// );

Posts.addView("2019reviewRecentDiscussionThreadsList", (terms: PostsViewTerms) => {
  return {
    selector: {
      ...recentDiscussionFilter,
      nominationCount2019: { $gt: 0 }
    },
    options: {
      sort: {lastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
// ensureIndex(Posts,
//   augmentForDefaultView({ nominationCount2019: 1, lastCommentedAt:-1, baseScore:1, hideFrontpageComments:1 }),
//   { name: "posts.2019reviewRecentDiscussionThreadsList", }
// );

Posts.addView("globalEvents", (terms: PostsViewTerms) => {
  const timeSelector = {$or: [
    {startTime: {$gt: moment().subtract(eventBuffer.startBuffer).toDate()}},
    {endTime: {$gt: moment().subtract(eventBuffer.endBuffer).toDate()}}
  ]}
  
  let onlineEventSelector: {} = terms.onlineEvent ? {onlineEvent: true} : {}
  if (terms.onlineEvent === false) {
    onlineEventSelector = {$or: [
      {onlineEvent: false}, {onlineEvent: {$exists: false}}
    ]}
  }
  
  let query = {
    selector: {
      $or: [
        {globalEvent: true},
        {$and: [
          {onlineEvent: true},
          {mongoLocation: {$exists: false}},
        ]},
      ],
      isEvent: true,
      groupId: null,
      eventType: terms.eventType ? {$in: terms.eventType} : null,
      $and: [
        timeSelector, onlineEventSelector
      ],
    },
    options: {
      sort: {
        startTime: 1,
        _id: 1
      }
    }
  }
  return query
})
ensureIndex(Posts,
  augmentForDefaultView({ globalEvent:1, eventType:1, startTime:1, endTime:1 }),
  { name: "posts.globalEvents" }
);

Posts.addView("nearbyEvents", (terms: PostsViewTerms) => {
  const timeSelector = {$or: [
    {startTime: {$gt: moment().subtract(eventBuffer.startBuffer).toDate()}},
    {endTime: {$gt: moment().subtract(eventBuffer.endBuffer).toDate()}}
  ]}
  
  let onlineEventSelector: {} = terms.onlineEvent ? {onlineEvent: true} : {}
  if (terms.onlineEvent === false) {
    onlineEventSelector = {$or: [
      {onlineEvent: false}, {onlineEvent: {$exists: false}}
    ]}
  }
  
  // Note: distance is in miles
  let query: any = {
    selector: {
      groupId: null,
      isEvent: true,
      eventType: terms.eventType ? {$in: terms.eventType} : null,
      $and: [
        timeSelector, onlineEventSelector
      ],
      $or: [
        {
          mongoLocation: {
            $geoWithin: {
              // $centerSphere takes an array containing the grid coordinates of the circle's center
              // point and the circle's radius measured in radians. We convert the maximum distance
              // (which is specified in miles, with a default of 100) into radians by dividing by the
              // approximate equitorial radius of the earth, 3963.2 miles.
              // When converting this to Postgres, we actually want the location in the form of a raw
              // longitude and latitude, which isn't the case for Mongo. To do this, we pass the selector
              // to the query builder manually here using $comment. This is a hack, but it's the only
              // place in the codebase where we use this operator so it's probably not worth spending a
              // ton of time making this beautiful.
              $centerSphere: [ [ terms.lng, terms.lat ], (terms.distance || 100) / 3963.2 ],
              $comment: { locationName: `"googleLocation"->'geometry'->'location'` },
            }
          }
        },
        {$and: [{mongoLocation: {$exists: false}}, {onlineEvent: true}]},
        {globalEvent: true} // also include events that are open to everyone around the world
      ]
    },
    options: {
      sort: {
        startTime: 1, // show events in chronological order
        _id: 1
      }
    }
  };
  if(Array.isArray(terms.filters) && terms.filters.length) {
    query.selector.types = {$in: terms.filters};
  } else if (typeof terms.filters === "string") { //If there is only single value we can't distinguish between Array and value
    query.selector.types = {$in: [terms.filters]};
  }
  return query;
});
ensureIndex(Posts,
  augmentForDefaultView({ mongoLocation:"2dsphere", eventType:1, startTime:1, endTime: 1 }),
  { name: "posts.2dsphere" }
);

Posts.addView("events", (terms: PostsViewTerms) => {
  const timeSelector = {
    $or: [
      { startTime: { $gt: moment().subtract(eventBuffer.startBuffer, 'hours').toDate() } },
      { endTime: { $gt: moment().subtract(eventBuffer.endBuffer, 'hours').toDate() } },
    ],
  };
  const twoMonthsAgo = moment().subtract(60, 'days').toDate();
  // make sure that, by default, events are not global
  let globalEventSelector: {} = terms.globalEvent ? {globalEvent: true} : {};
  if (terms.globalEvent === false) {
    globalEventSelector = {$or: [
      {globalEvent: false}, {globalEvent: {$exists:false}}
    ]}
  }
  
  let onlineEventSelector: {} = terms.onlineEvent ? {onlineEvent: true} : {}
  if (terms.onlineEvent === false) {
    onlineEventSelector = {$or: [
      {onlineEvent: false}, {onlineEvent: {$exists: false}}
    ]}
  }
  
  return {
    selector: {
      isEvent: true,
      $and: [
        timeSelector, globalEventSelector, onlineEventSelector
      ],
      createdAt: {$gte: twoMonthsAgo},
      groupId: terms.groupId ? terms.groupId : null,
      baseScore: {$gte: 1},
    },
    options: {
      sort: {
        startTime: 1
      }
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ globalEvent: 1, onlineEvent: 1, startTime:1, endTime: 1, createdAt:1, baseScore:1 }),
  { name: "posts.events" }
);

Posts.addView("eventsInTimeRange", (terms: PostsViewTerms) => {
  return {
    selector: {
      isEvent: true,
      groupId: terms.groupId ? terms.groupId : null,
    },
    options: {
      sort: {
        startTime: -1,
      }
    }
  }
})
// Same index as events

Posts.addView("upcomingEvents", (terms: PostsViewTerms) => {
  const timeCutoff = moment().subtract(eventBuffer.startBuffer).toDate();
  
  return {
    selector: {
      isEvent: true,
      groupId: terms.groupId ? terms.groupId : null,
      startTime: {$gte: timeCutoff},
    },
    options: {
      sort: {
        startTime: 1,
      }
    }
  }
})

Posts.addView("pastEvents", (terms: PostsViewTerms) => {
  const timeCutoff = moment().subtract(eventBuffer.startBuffer).toDate();
  
  return {
    selector: {
      isEvent: true,
      groupId: terms.groupId ? terms.groupId : null,
      startTime: {$lt: timeCutoff},
    },
    options: {
      sort: {
        startTime: -1,
      }
    },
  }
});

Posts.addView("tbdEvents", (terms: PostsViewTerms) => {
  return {
    selector: {
      isEvent: true,
      groupId: terms.groupId ? terms.groupId : null,
      startTime: viewFieldNullOrMissing,
    },
    options: {
      sort: {
        postedAt: 1,
      }
    },
  }
});

Posts.addView("nonEventGroupPosts", (terms: PostsViewTerms) => {
  return {
    selector: {
      isEvent: false,
      groupId: terms.groupId ? terms.groupId : null,
    },
  }
});

Posts.addView("postsWithBannedUsers", function () {
  return {
    selector: {
      bannedUserIds: {$exists: true}
    },
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ bannedUserIds:1, createdAt: 1 }),
  { name: "posts.postsWithBannedUsers" }
);

Posts.addView("communityResourcePosts", function () {
  return {
    selector: {
      _id: {$in: ['bDnFhJBcLQvCY3vJW', 'qMuAazqwJvkvo8teR', 'PqMT9zGrNsGJNfiFR', 'YdcF6WbBmJhaaDqoD', 'mQDoZ2yCX2ujLxJDk']}
    },
  }
})
// No index needed

Posts.addView("sunshineNewPosts", function () {
  return {
    selector: {
      reviewedByUserId: {$exists: false},
    },
    options: {
      sort: {
        createdAt: -1,
      }
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ status:1, reviewedByUserId:1, frontpageDate: 1, authorIsUnreviewed:1, meta: 1 }),
  { name: "posts.sunshineNewPosts" }
);

Posts.addView("sunshineNewUsersPosts", (terms: PostsViewTerms) => {
  return {
    selector: {
      status: null, // allow sunshines to see posts marked as spam
      userId: terms.userId,
      authorIsUnreviewed: null,
      groupId: null,
      draft: viewFieldAllowAny,
      rejected: null
    },
    options: {
      sort: {
        createdAt: -1,
      }
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ status:1, userId:1, hideAuthor: 1, reviewedByUserId:1, frontpageDate: 1, authorIsUnreviewed:1, createdAt: -1 }),
  { name: "posts.sunshineNewUsersPosts" }
);

Posts.addView("sunshineCuratedSuggestions", function (terms) {
  const audio = terms.audioOnly ? {podcastEpisodeId: {$exists: true}} : {}
  return {
    selector: {
      ...audio,
      suggestForCuratedUserIds: {$exists:true, $ne: []},
      reviewForCuratedUserId: {$exists:false}
    },
    options: {
      sort: {
        postedAt: -1,
      },
      hint: "posts.sunshineCuratedSuggestions",
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ postedAt:1, reviewForCuratedUserId:1, suggestForCuratedUserIds:1, }),
  {
    name: "posts.sunshineCuratedSuggestions",
    partialFilterExpression: {suggestForCuratedUserIds: {$exists:true}},
  }
);



// Used in Posts.find() in various places
ensureIndex(Posts, {userId:1, createdAt:-1});

// Used in routes
ensureIndex(Posts, {agentFoundationsId: "hashed"});

// Used in checkScheduledPosts cronjob
ensureIndex(Posts, {isFuture:1, postedAt:1});

// Used in scoring aggregate query
ensureIndex(Posts, {inactive:1,postedAt:1});

// Used for recommendations
ensureIndex(Posts,
  augmentForDefaultView({ meta:1, disableRecommendation:1, baseScore:1, curatedDate:1, frontpageDate:1 }),
  { name: "posts.recommendable" }
);

Posts.addView("hasEverDialogued", (terms: PostsViewTerms) => {
  return {
    selector: {
      $or: [
        {userId: terms.userId},
        {"coauthorStatuses.userId": terms.userId}
      ],
      collabEditorDialogue: true,
    },
  }
})

Posts.addView("pingbackPosts", (terms: PostsViewTerms) => {
  return {
    selector: {
      ...jsonArrayContainsSelector("pingbacks.Posts", terms.postId),
      baseScore: {$gt: 0}
    },
    options: {
      sort: { baseScore: -1 },
    },
  }
});
ensureIndex(Posts,
  augmentForDefaultView({ "pingbacks.Posts": 1, baseScore: 1 }),
  { name: "posts.pingbackPosts" }
);
void ensureCustomPgIndex(`CREATE INDEX IF NOT EXISTS idx_posts_pingbacks ON "Posts" USING gin(pingbacks);`);

// TODO: refactor nominations2018 to use nominationCount + postedAt
Posts.addView("nominations2018", (terms: PostsViewTerms) => {
  return {
    selector: {
      // FIXME: Should only apply during voting
      nominationCount2018: { $gt: 2 }
    },
    options: {
      sort: {
        nominationCount2018: terms.sortByMost ? -1 : 1
      }
    }
  }
})
// ensureIndex(Posts,
//   augmentForDefaultView({ nominationCount2018:1 }),
//   { name: "posts.nominations2018", }
// );

// TODO: refactor nominations2019 to filter for nominationsCount + postedAt
Posts.addView("nominations2019", (terms: PostsViewTerms) => {
  return {
    selector: {
      // FIXME: Should only apply during voting
      nominationCount2019: { $gt: 0 }
    },
    options: {
      sort: {
        nominationCount2019: terms.sortByMost ? -1 : 1
      }
    }
  }
})
// ensureIndex(Posts,
//   augmentForDefaultView({ nominationCount2019:1 }),
//   { name: "posts.nominations2019", }
// );

Posts.addView("reviews2018", (terms: PostsViewTerms) => {
  const sortings = {
    "fewestReviews" : {reviewCount2018: 1},
    "mostReviews" : {reviewCount2018: -1},
    "lastCommentedAt" :  {lastCommentedAt: -1}
  }

  return {
    selector: {
      nominationCount2018: { $gte: 2 },
      // FIXME: Should only apply to voting
      reviewCount2018: { $gte: 1 }
    },
    options: {
      sort: { ...(terms.sortBy ? sortings[terms.sortBy] : undefined), nominationCount2018: -1 }
    }
  }
})

const reviews2019Sortings: Record<ReviewSortings, MongoSort<DbPost>> = {
  "fewestReviews" : {reviewCount2019: 1},
  "mostReviews" : {reviewCount2019: -1},
  "lastCommentedAt" :  {lastCommentedAt: -1}
}

Posts.addView("reviews2019", (terms: PostsViewTerms) => {
  return {
    selector: {
      nominationCount2019: { $gte: 2 }
    },
    options: {
      sort: { ...(terms.sortBy && reviews2019Sortings[terms.sortBy]), nominationCount2019: -1 }
    }
  }
})

Posts.addView("voting2019", (terms: PostsViewTerms) => {
  return {
    selector: {
      nominationCount2019: { $gte: 2 },
      // FIXME: Should only apply to voting
      reviewCount2019: { $gte: 1 }
    },
    options: {
      sort: { ...(terms.sortBy && reviews2019Sortings[terms.sortBy]), nominationCount2019: -1 }
    }
  }
})
// We're filtering on nominationCount greater than 2, so do not need additional indexes
// using nominations2018

Posts.addView("stickied", (terms: PostsViewTerms, _, context?: ResolverContext) => ({
    selector: {
      sticky: true,
      ...(context?.currentUser?._id ? {_id: {$ne: startHerePostIdSetting.get()}} : {}),
    },
    options: {
      sort: {
        stickyPriority: -1,
      },
    },
  }
));

// used to find a user's upvoted posts, so they can nominate them for the Review
Posts.addView("nominatablePostsByVote", (terms: PostsViewTerms, _, context?: ResolverContext) => {
  const nominationFilter = terms.requiredUnnominated ? {positiveReviewVoteCount: { $lt: REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD }} : {}
  const frontpageFilter = terms.requiredFrontpage ? {frontpageDate: {$exists: true}} : {}
  return {
    selector: {
      userId: {$ne: context?.currentUser?._id,},
      ...frontpageFilter,
      ...nominationFilter,
      isEvent: false
    },
    options: {
      sort: {
        baseScore: -1
      }
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ _id: 1, userId: 1, isEvent:1, baseScore:1 }),
  { name: "posts.nominatablePostsByVote", }
);


// Exclude IDs that should not be included, e.g. were republished and postedAt date isn't actually in current review
const reviewExcludedPostIds = ['MquvZCGWyYinsN49c'];

// Nominations for the (≤)2020 review are determined by the number of votes
Posts.addView("reviewVotingNew", (terms: PostsViewTerms) => {
  if (!terms.reviewYear) {
    throw new Error("reviewYear is required for reviewVoting view");
  }
  return {
    selector: {
      $or: [
        {[`tagRelevance.${longformReviewTagId}`]: {$gte: 1}},
        {
          $and: [
            {postedAt: {$gte: moment.utc(`${terms.reviewYear}-01-01`).toDate()}},
            {postedAt: {$lt: moment.utc(`${terms.reviewYear+1}-01-01`).toDate()}},
            {positiveReviewVoteCount: { $gte: getPositiveVoteThreshold(terms.reviewPhase) }}
          ]
        }
      ],
      _id: { $nin: reviewExcludedPostIds }
    },
    options: {
      // This sorts the posts deterministically, which is important for the
      // relative stability of the seeded frontend sort
      sort: {
        lastCommentedAt: -1
      },
      ...(terms.excludeContents ?
        {projection: {contents: 0}} :
        {})
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ positiveReviewVoteCount: 1, tagRelevance: 1, createdAt: 1 }),
  { name: "posts.positiveReviewVoteCount", }
);


Posts.addView("reviewQuickPage", (terms: PostsViewTerms) => {
  return {
    selector: {
      reviewCount: 0,
      positiveReviewVoteCount: { $gte: REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD },
      reviewVoteScoreAllKarma: { $gte: QUICK_REVIEW_SCORE_THRESHOLD }
    },
    options: {
      sort: {
        reviewVoteScoreHighKarma: -1
      }
    }
  }
})


// During the Final Voting phase, posts need at least one positive vote and at least one review to qualify
Posts.addView("reviewFinalVoting", (terms: PostsViewTerms) => {
  return {
    selector: {
      reviewCount: { $gte: VOTING_PHASE_REVIEW_THRESHOLD },
      positiveReviewVoteCount: { $gte: REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD },
      _id: { $nin: reviewExcludedPostIds }
    },
    options: {
      // This sorts the posts deterministically, which is important for the
      // relative stability of the seeded frontend sort
      sort: {
        lastCommentedAt: -1
      },
      ...(terms.excludeContents ?
        {projection: {contents: 0}} :
        {})
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ positiveReviewVoteCount: 1, reviewCount: 1, createdAt: 1 }),
  { name: "posts.positiveReviewVoteCountReviewCount", }
);

Posts.addView("myBookmarkedPosts", (terms: PostsViewTerms, _, context?: ResolverContext) => {
  // Get list of bookmarked posts from the user object. This is ordered by when
  // the bookmark was created (earlier is older).
  let bookmarkedPostIds = (context?.currentUser?.bookmarkedPostsMetadata
    ? uniq(context?.currentUser?.bookmarkedPostsMetadata.map(bookmark => bookmark.postId))
    : []
  );
  
  // If there's a limit, apply that limit to the list of IDs, before it's applied
  // to the query. (We do this because the $in operator isn't going to respect
  // the ordering of the IDs we give it).
  //
  // HACK: While the limit reflects the sort ordering of
  // currentUser.bookmarkedPostsMetadata, the results ordering doesn't. So the
  // BookmarksList component sorts the results itself after they come back.
  if (terms.limit) {
    bookmarkedPostIds = bookmarkedPostIds.reverse().slice(0, terms.limit);
  }
  
  return {
    selector: {
      _id: {$in: bookmarkedPostIds},
      isEvent: viewFieldAllowAny,
      groupId: null
    },
    options: {
      sort: {},
    },
  };
});


/**
 * For preventing both `PostsRepo.getRecentlyActiveDialogues` and `PostsRepo.getMyActiveDialogues` from being seq scans on Posts.
 * Given the relatively small number of dialogues, `getMyActiveDialogues` still ends up being fast even though it needs to check each dialogue for userId/coauthorStatuses.
 * 
 * This also speeds up `UsersRepo.getUsersWhoHaveMadeDialogues` a bunch.
 */
void ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Posts_max_postedAt_mostRecentPublishedDialogueResponseDate"
  ON "Posts" (GREATEST("postedAt", "mostRecentPublishedDialogueResponseDate") DESC)
  WHERE "collabEditorDialogue" IS TRUE;
`);

// Needed to speed up getPostsAndCommentsFromSubscriptions, which otherwise has a pretty slow nested loop when joining on Posts because of the "postedAt" filter
ensureIndex(Posts, { userId: 1, postedAt: 1 }, { concurrently: true });
