import { Posts } from './collection';
import Users from 'meteor/vulcan:users';
import { viewFieldNullOrMissing, viewFieldAllowAny } from 'meteor/vulcan:lib';
import { getSetting } from 'meteor/vulcan:core';
import { ensureIndex,  combineIndexWithDefaultViewIndex} from '../../collectionUtils';
import moment from 'moment';

export const DEFAULT_LOW_KARMA_THRESHOLD = -10
export const MAX_LOW_KARMA_THRESHOLD = -1000

/**
 * @description In allPosts and elsewhere (every component that uses PostsListSettings and some
 * that use PostsList) we use the concept of filters which are like Vulcan's
 * views, but are more composable. Filters only specify selectors, and are
 * written with MongoDB query syntax.
 * To avoid duplication of code, views with the same name, will reference the
 * corresponding filter
 */
const filters = {
  "curated": {
    curatedDate: {$gt: new Date(0)}
  },
  "frontpage": {
    frontpageDate: {$gt: new Date(0)}
  },
  "frontpageAndMeta": {
    // NB:   Currently only used on EA Forum
    // NB#2: Do not combine this with a view that specifies a selector with
    // $or, as this will be overwritten.
    $or: [
      {frontpageDate: {$gt: new Date(0)}},
      {meta: true}
    ]
  },
  "all": {
    groupId: null
  },
  "questions": {
    question: true,
    hiddenRelatedQuestion: viewFieldAllowAny
  },
  "events": {
    isEvent: true
  },
  "meta": {
    meta: true
  },
  "includeMetaAndPersonal": {}
}
if (getSetting('forumType') === 'EAForum') filters.frontpage.meta = {$ne: true}

/**
 * @summary Similar to filters (see docstring above), but specifying MongoDB-style sorts
 *
 * NB: Vulcan views overwrite sortings. If you are using a named view with a
 * sorting, do not try to supply your own.
 */
const sortings = {
  magic: {score: -1},
  top: {baseScore: -1},
  new: {postedAt: -1},
  old: {postedAt: 1},
  recentComments: {lastCommentedAt: -1}
}

/**
 * @summary Base parameters that will be common to all other view unless specific properties are overwritten
 *
 * NB: Specifying "before" into posts views is a bit of a misnomer at present,
 * as it is *inclusive*. The parameters callback that handles it outputs
 * ~ $lt: before.endOf('day').
 */
Posts.addDefaultView(terms => {
  const validFields = _.pick(terms, 'userId', 'meta', 'groupId', 'af','question', 'authorIsUnreviewed');
  // Also valid fields: before, after, timeField (select on postedAt), and
  // karmaThreshold (selects on baseScore).

  const alignmentForum = getSetting('forumType') === 'AlignmentForum' ? {af: true} : {}
  let params = {
    selector: {
      status: Posts.config.STATUS_APPROVED,
      draft: false,
      isFuture: false,
      unlisted: false,
      shortform: false,
      authorIsUnreviewed: false,
      hiddenRelatedQuestion: false,
      groupId: viewFieldNullOrMissing,
      ...validFields,
      ...alignmentForum
    },
    options: {},
  }
  // TODO: Use default threshold in default view
  // TODO: Looks like a bug in cases where karmaThreshold = 0, because we'd
  // still want to filter.
  if (terms.karmaThreshold && terms.karmaThreshold !== "0") {
    params.selector.baseScore = {$gte: parseInt(terms.karmaThreshold, 10)}
    params.selector.maxBaseScore = {$gte: parseInt(terms.karmaThreshold, 10)}
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
  if (terms.sortedBy) {
    if (sortings[terms.sortedBy]) {
      params.options = {sort: {...params.options.sort, ...sortings[terms.sortedBy]}}
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `Sorting '${terms.sortedBy}' not recognized while constructing defaultView`,
        terms.view ? ` for view ${terms.view}` : ''
      )
    }
  }
  return params;
})

export function augmentForDefaultView(indexFields)
{
  return combineIndexWithDefaultViewIndex({
    viewFields: indexFields,
    prefix: {status:1, isFuture:1, draft:1, unlisted:1, shortform: 1, hiddenRelatedQuestion:1, authorIsUnreviewed:1, groupId:1 },
    suffix: { _id:1, meta:1, isEvent:1, af:1, frontpageDate:1, curatedDate:1, postedAt:1, baseScore:1 },
  });
}


/**
 * @summary User posts view
 */

Posts.addView("userPosts", terms => {
  const sortOverride = terms.sortedBy ? {} : {sort: {postedAt: -1}}
  return {
    selector: {
      userId: viewFieldAllowAny,
      hiddenRelatedQuestion: viewFieldAllowAny,
      shortform: viewFieldAllowAny,
      groupId: null, // TODO: fix vulcan so it doesn't do deep merges on viewFieldAllowAny
      $or: [{userId: terms.userId}, {coauthorUserIds: terms.userId}],
    },
    options: {
      limit: 5,
      ...sortOverride
    }
  }
});
ensureIndex(Posts,
  augmentForDefaultView({ userId: 1, hideAuthor: 1, postedAt: -1, }),
  {
    name: "posts.userId_postedAt",
  }
);
ensureIndex(Posts,
  augmentForDefaultView({ coauthorUserIds: 1, postedAt: -1, }),
  {
    name: "posts.coauthorUserIds_postedAt",
  }
);

const setStickies = (sortOptions, terms) => {
  if (terms.af && terms.forum) {
    return { afSticky: -1, ...sortOptions}
  } else if (terms.meta && terms.forum) {
    return { metaSticky: -1, ...sortOptions}
  } else if (terms.forum) {
    return { sticky: -1, ...sortOptions}
  }
  return sortOptions
}

const stickiesIndexPrefix = {
  afSticky: -1, metaSticky: -1
};


Posts.addView("magic", terms => ({
  options: {sort: setStickies(sortings.magic, terms)}
}))
ensureIndex(Posts,
  augmentForDefaultView({ score:-1 }),
  {
    name: "posts.score",
  }
);
ensureIndex(Posts,
  augmentForDefaultView({ afSticky:-1, score:-1 }),
  {
    name: "posts.afSticky_score",
  }
);
ensureIndex(Posts,
  augmentForDefaultView({ metaSticky:-1, score:-1 }),
  {
    name: "posts.metaSticky_score",
  }
);
ensureIndex(Posts,
  augmentForDefaultView({ userId: 1, hideAuthor: 1, ...stickiesIndexPrefix, score:-1 }),
  {
    name: "posts.userId_stickies_score",
  }
);


Posts.addView("top", terms => ({
  options: {sort: setStickies(sortings.top, terms)}
}))
ensureIndex(Posts,
  augmentForDefaultView({ ...stickiesIndexPrefix, baseScore:-1 }),
  {
    name: "posts.stickies_baseScore",
  }
);
ensureIndex(Posts,
  augmentForDefaultView({ userId: 1, hideAuthor: 1, ...stickiesIndexPrefix, baseScore:-1 }),
  {
    name: "posts.userId_stickies_baseScore",
  }
);


Posts.addView("new", terms => ({
  options: {sort: setStickies(sortings.new, terms)}
}))
ensureIndex(Posts,
  augmentForDefaultView({ ...stickiesIndexPrefix, postedAt:-1 }),
  {
    name: "posts.stickies_postedAt",
  }
);
ensureIndex(Posts,
  augmentForDefaultView({ userId: 1, hideAuthor: 1, ...stickiesIndexPrefix, postedAt:-1 }),
  {
    name: "posts.userId_stickies_postedAt",
  }
);

Posts.addView("recentComments", terms => ({
  options: {sort: sortings.recentComments}
}))

Posts.addView("old", terms => ({
  options: {sort: sortings.old}
}))
// Covered by the same index as `new`

Posts.addView("timeframe", terms => ({
  options: {limit: terms.limit}
}))
ensureIndex(Posts,
  augmentForDefaultView({ postedAt:1, baseScore:1}),
  {
    name: "posts.postedAt_baseScore",
  }
);

Posts.addView("daily", terms => ({
  options: {
    sort: {baseScore: -1}
  }
}));
ensureIndex(Posts,
  augmentForDefaultView({ postedAt:1, baseScore:1}),
  {
    name: "posts.postedAt_baseScore",
  }
);

Posts.addView("frontpage", terms => ({
  selector: filters.frontpage,
  options: {
    sort: {sticky: -1, score: -1}
  }
}));
ensureIndex(Posts,
  augmentForDefaultView({ sticky: -1, score: -1, frontpageDate:1 }),
  {
    name: "posts.frontpage",
    partialFilterExpression: filters.frontpage,
  }
);

Posts.addView("frontpage-rss", terms => ({
  selector: filters.frontpage,
  options: {
    sort: {frontpageDate: -1, postedAt: -1}
  }
}));
// Covered by the same index as `frontpage`

Posts.addView("curated", terms => ({
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

Posts.addView("curated-rss", terms => ({
  selector: {
    curatedDate: {$gt: new Date(0)},
  },
  options: {
    sort: {curatedDate: -1, postedAt: -1}
  }
}));
// Covered by the same index as `curated`

Posts.addView("community", terms => ({
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

Posts.addView("community-rss", terms => ({
  selector: {
    frontpageDate: null,
    maxBaseScore: {$gt: 2}
  },
  options: {
    sort: {postedAt: -1}
  }
}));
// Covered by the same index as `new`

Posts.addView("meta-rss", terms => ({
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


Posts.addView("topQuestions", terms => ({
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

Posts.addView("recentQuestionActivity", terms => ({
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
Posts.addView("scheduled", terms => ({
  selector: {
    status: Posts.config.STATUS_APPROVED,
    isFuture: true
  },
  options: {
    sort: {postedAt: -1}
  }
}));
// Covered by the same index as `new`


/**
 * @summary Draft view
 */
Posts.addView("drafts", terms => {
  return {
    selector: {
      userId: viewFieldAllowAny,
      $or: [{userId: terms.userId}, {shareWithUsers: terms.userId}],
      draft: true,
      deletedDraft: false,
      hideAuthor: false,
      unlisted: null,
      groupId: null, // TODO: fix vulcan so it doesn't do deep merges on viewFieldAllowAny
      authorIsUnreviewed: viewFieldAllowAny,
      hiddenRelatedQuestion: viewFieldAllowAny,
    },
    options: {
      sort: {createdAt: -1}
    }
}});
ensureIndex(Posts,
  augmentForDefaultView({ userId: 1, hideAuthor: 1, deletedDraft: 1, createdAt: -1 }),
  { name: "posts.userId_createdAt" }
);
ensureIndex(Posts,
  augmentForDefaultView({ shareWithUsers: 1, deletedDraft: 1, createdAt: -1 }),
  { name: "posts.userId_shareWithUsers" }
);

/**
 * @summary All drafts view
 */
Posts.addView("all_drafts", terms => ({
  selector: {
    draft: true
  },
  options: {
    sort: {createdAt: -1}
  }
}));

Posts.addView("unlisted", terms => {
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

/**
 * @summary User upvoted posts view
 */
Posts.addView("userUpvotedPosts", (terms, apolloClient) => {
  // TODO: Delete, unused and broken. (Broken because user.upvotedPosts is no longer a field that exists).
  var user = apolloClient ? Users.findOneInStore(apolloClient.store, terms.userId) : Users.findOne(terms.userId);

  var postsIds = _.pluck(user.upvotedPosts, "itemId");
  return {
    selector: {_id: {$in: postsIds}, userId: {$ne: terms.userId}}, // exclude own posts
    options: {limit: 5, sort: {postedAt: -1}}
  };
});

/**
 * @summary User downvoted posts view
 */
Posts.addView("userDownvotedPosts", (terms, apolloClient) => {
  // TODO: Delete, unused and broken. (Broken because user.downvotedPosts is no longer a field that exists).
  var user = apolloClient ? Users.findOneInStore(apolloClient.store, terms.userId) : Users.findOne(terms.userId);

  var postsIds = _.pluck(user.downvotedPosts, "itemId");
  // TODO: sort based on votedAt timestamp and not postedAt, if possible
  return {
    selector: {_id: {$in: postsIds}},
    options: {limit: 5, sort: {postedAt: -1}}
  };
});

Posts.addView("slugPost", terms => ({
  selector: {
    slug: terms.slug,
  },
  options: {
    limit: 1,
  }
}));
ensureIndex(Posts, {"slug": "hashed"});

Posts.addView("recentDiscussionThreadsList", terms => {
  return {
    selector: {
      baseScore: {$gt:0},
      hideFrontpageComments: false,
      hiddenRelatedQuestion: viewFieldAllowAny,
      shortform: viewFieldAllowAny,
      groupId: null,
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

Posts.addView("shortformDiscussionThreadsList", terms => {
  return {
    selector: {
      baseScore: {$gt:0},
      hideFrontpageComments: false,
      shortform: true,
      hiddenRelatedQuestion: viewFieldAllowAny,
      groupId: null,
    },
    options: {
      sort: {lastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ hideFrontpageComments:1, shortForm: 1, lastCommentedAt:-1, baseScore:1,}),
  { name: "posts.shortformDiscussionThreadsList", }
);

Posts.addView("nearbyEvents", function (terms) {
  const yesterday = moment().subtract(1, 'days').toDate();
  let query = {
    selector: {
      location: {$exists: true},
      groupId: null,
      isEvent: true,
      $or: [{startTime: {$exists: false}}, {startTime: {$gt: yesterday}}],
      mongoLocation: {
        $near: {
          $geometry: {
               type: "Point" ,
               coordinates: [ terms.lng, terms.lat ]
          },
        },
      }
    },
    options: {
      sort: {
        createdAt: null,
        _id: null
      }
    }
  };
  if(Array.isArray(terms.filters) && terms.filters.length) {
    query.types = {$in: terms.filters};
  } else if (typeof terms.filters === "string") { //If there is only single value we can't distinguish between Array and value
    query.selector.types = {$in: [terms.filters]};
  }
  return query;
});
ensureIndex(Posts,
  augmentForDefaultView({ mongoLocation:"2dsphere", location:1, startTime:1 }),
  { name: "posts.2dsphere" }
);

Posts.addView("events", function (terms) {
  const yesterday = moment().subtract(1, 'days').toDate();
  const twoMonthsAgo = moment().subtract(60, 'days').toDate();
  return {
    selector: {
      isEvent: true,
      createdAt: {$gte: twoMonthsAgo},
      groupId: terms.groupId ? terms.groupId : null,
      baseScore: {$gte: 1},
      $or: [{startTime: {$exists: false}}, {startTime: {$gte: yesterday}}],
    },
    options: {
      sort: {
        baseScore: -1,
        startTime: -1,
      }
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ startTime:1, createdAt:1, baseScore:1 }),
  { name: "posts.events" }
);

Posts.addView("pastEvents", function (terms) {
  return {
    selector: {
      isEvent: true,
      groupId: terms.groupId ? terms.groupId : null,
      baseScore: {$gte: 1},
    },
    options: {
      sort: {
        baseScore: -1,
        startTime: -1,
      }
    }
  }
})
// Same index as events

Posts.addView("upcomingEvents", function (terms) {
  const oneDayAgo = moment().subtract(1, 'days').toDate();

  return {
    selector: {
      isEvent: true,
      groupId: terms.groupId ? terms.groupId : null,
      baseScore: {$gte: 1},
      startTime: {$gte: oneDayAgo}
    },
    options: {
      sort: {
        startTime: 1,
      }
    }
  }
})
// Same index as events

Posts.addView("groupPosts", function (terms) {
  return {
    selector: {
      isEvent: null,
      groupId: terms.groupId,
      authorIsUnreviewed: viewFieldAllowAny
    },
    options: {
      sort: {
        sticky: -1,
        createdAt: -1,
      }
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ groupId: 1, sticky: -1, createdAt: -1 }),
  { name: "posts.groupPosts" }
);

Posts.addView("postsWithBannedUsers", function () {
  return {
    selector: {
      bannedUserIds: {$exists: true}
    },
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ bannedUserIds:1 }),
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
      frontpageDate: viewFieldNullOrMissing,
      meta: false,
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

Posts.addView("sunshineNewUsersPosts", function (terms) {
  return {
    selector: {
      status: null, // allow sunshines to see posts marked as spam
      userId: terms.userId,
      authorIsUnreviewed: null
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

Posts.addView("sunshineCuratedSuggestions", function () {
  return {
    selector: {
      suggestForCuratedUserIds: {$exists:true, $ne: []},
      reviewForCuratedUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      },
      hint: "posts.sunshineCuratedSuggestions",
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ createdAt:1, reviewForCuratedUserId:1, suggestForCuratedUserIds:1, }),
  {
    name: "posts.sunshineCuratedSuggestions",
    partialFilterExpression: {suggestForCuratedUserIds: {$exists:true}},
  }
);

Posts.addView("afRecentDiscussionThreadsList", terms => {
  return {
    selector: {
      baseScore: {$gt:0},
      hideFrontpageComments: false,
      af: true,
    },
    options: {
      sort: {afLastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
ensureIndex(Posts,
  augmentForDefaultView({ hideFrontpageComments:1, afLastCommentedAt:-1, baseScore:1 }),
  { name: "posts.afRecentDiscussionThreadsList", }
);

// Used in Posts.find() in various places
ensureIndex(Posts, {userId:1, createdAt:-1});

// Used in routes
ensureIndex(Posts, {legacyId: "hashed"});
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
