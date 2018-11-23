import { Posts } from './collection';
import Users from 'meteor/vulcan:users';
import { getSetting } from 'meteor/vulcan:core';
import { ensureIndex } from '../../collectionUtils';
import moment from 'moment';


/**
 * @summary Base parameters that will be common to all other view unless specific properties are overwritten
 */
Posts.addDefaultView(terms => {
  const validFields = _.pick(terms, 'userId', 'meta', 'groupId', 'af');
  // Also valid fields: before, after, karmaThreshold, timeField
  
  const alignmentForum = getSetting('AlignmentForum', false) ? {af: true} : {}
  let params = {
    selector: {
      status: Posts.config.STATUS_APPROVED,
      draft: {$ne: true},
      isFuture: {$ne: true}, // match both false and undefined
      unlisted: {$ne: true},
      meta: {$ne: true},
      groupId: {$exists: false},
      isEvent: {$ne: true},
      ...validFields,
      ...alignmentForum
    }
  }
  if (terms.karmaThreshold && terms.karmaThreshold !== "0") {
    params.selector.maxBaseScore = {$gte: parseInt(terms.karmaThreshold, 10)}
  }
  if (terms.userId) {
    params.selector.hideAuthor = {$ne: true}
  }
  return params;
})

const commonIndexPrefix = {
  isFuture:1, status:1, draft:1, meta:1, groupId:1, af:1
};
const commonPartialFilterExpression = {
};


/**
 * @summary User posts view
 */
Posts.addView("userPosts", terms => ({
  selector: {
    userId: terms.userId,
  },
  options: {
    limit: 5,
    sort: {
      score: -1,
    }
  }
}));
ensureIndex(Posts,
  { ...commonIndexPrefix, userId: 1, score: -1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);

const setStickies = (sortOptions, terms) => {
  if (terms.af && terms.forum) {
    return { afSticky: -1, ...sortOptions}
  } else if (terms.meta && terms.forum) {
    return { metaSticky: -1, ...sortOptions}
  }
  return sortOptions
}

const stickiesIndexPrefix = {
  afSticky: -1, metaSticky: -1
};


Posts.addView("magicalSorting", terms => ({
  options: {sort: setStickies({score: -1}, terms)}
}))
ensureIndex(Posts,
  { ...commonIndexPrefix, ...stickiesIndexPrefix, score:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);
ensureIndex(Posts,
  { ...commonIndexPrefix, userId: 1, ...stickiesIndexPrefix, score:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);


Posts.addView("top", terms => ({
  options: {sort: setStickies({baseScore: -1}, terms)}
}))
ensureIndex(Posts,
  { ...commonIndexPrefix, ...stickiesIndexPrefix, baseScore:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);
ensureIndex(Posts,
  { ...commonIndexPrefix, userId: 1, ...stickiesIndexPrefix, baseScore:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);


Posts.addView("new", terms => ({
  options: {sort: setStickies({postedAt: -1}, terms)}
}))
ensureIndex(Posts,
  { ...commonIndexPrefix, ...stickiesIndexPrefix, postedAt:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);
ensureIndex(Posts,
  { ...commonIndexPrefix, userId: 1, ...stickiesIndexPrefix, postedAt:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);


Posts.addView("old", terms => ({
  options: {sort: setStickies({postedAt: 1}, terms)}
}))
// Covered by the same index as `new`

Posts.addView("daily", terms => ({
  selector: {
    baseScore: {$gt: terms.karmaThreshold || -100}
  },
  options: {
    sort: {score: -1}
  }
}));
ensureIndex(Posts,
  { ...commonIndexPrefix, postedAt:1, },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);

Posts.addView("frontpage", terms => ({
  selector: {
    frontpageDate: {$ne: null},
  },
  options: {
    sort: {sticky: -1, score: -1}
  }
}));
ensureIndex(Posts,
  { ...commonIndexPrefix, sticky: -1, score: -1 },
  {
    partialFilterExpression: {
      ...commonPartialFilterExpression,
      frontpageDate: {$exists: true}
    }
  }
);

Posts.addView("frontpage-rss", terms => ({
  selector: {
    frontpageDate: {$ne: null},
  },
  options: {
    sort: {frontpageDate: -1, postedAt: -1}
  }
}));
// Covered by the same index as `frontpage`

Posts.addView("curated", terms => ({
  selector: {
    curatedDate: {$ne: null},
  },
  options: {
    sort: {sticky: -1, curatedDate: -1, postedAt: -1}
  }
}));
ensureIndex(Posts,
  { ...commonIndexPrefix, sticky: -1, curatedDate:-1 },
  {
    partialFilterExpression: {
      ...commonPartialFilterExpression,
      curatedDate: {$exists: true}
    }
  }
);

Posts.addView("curated-rss", terms => ({
  selector: {
    curatedDate: {$ne: null},
  },
  options: {
    sort: {curatedDate: -1, postedAt: -1}
  }
}));
// Covered by the same index as `curated`

Posts.addView("community", terms => ({
  selector: {
    frontpageDate: null,
    meta: null,
  },
  options: {
    sort: {sticky: -1, score: -1}
  }
}));
// Can't usefully index `community` beyond sorting by sticky and score, because
// of liminations on partialFilterExpression.
ensureIndex(Posts,
  { ...commonIndexPrefix, sticky: -1, score: -1 },
  { partialFilterExpression: { ...commonPartialFilterExpression, } }
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
// Covered by commonIndexPrefix and the same index as `new`

Posts.addView('rss', Posts.views['community-rss']); // default to 'community-rss' for rss


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
// Covered by commonIndexPrefix and the same index as `new`


/**
 * @summary Draft view
 */
Posts.addView("drafts", terms => {
  return {
    selector: {
      userId: terms.userId,
      draft: true,
      hideAuthor: {$ne: true},
      unlisted: null,
      meta: null,
    },
    options: {
      sort: {createdAt: -1}
    }
}});
ensureIndex(Posts,
  { ...commonIndexPrefix, userId: 1, createdAt: -1 },
  {
    partialFilterExpression: {
      draft: true
    }
  }
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
// Possibly unused view?

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
ensureIndex(Posts,
  {"slug": "hashed"},
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);

Posts.addView("recentDiscussionThreadsList", terms => {
  return {
    selector: {
      baseScore: {$gt:0},
      hideFrontpageComments: {$ne: true},
      meta: null,
      groupId: null,
      isEvent: null,
    },
    options: {
      sort: {lastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
ensureIndex(Posts,
  { ...commonIndexPrefix, lastCommentedAt:-1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
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
  { ...commonIndexPrefix, mongoLocation:"2dsphere" },
  {
    partialFilterExpression: {
      location: {$exists: true},
      ...commonPartialFilterExpression,
      isEvent: true,
    }
  }
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
  { ...commonIndexPrefix, startTime:1 },
  {
    partialFilterExpression: {
      ...commonPartialFilterExpression,
      isEvent: true,
    }
  }
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

Posts.addView("groupPosts", function (terms) {
  return {
    selector: {
      isEvent: null,
      groupId: terms.groupId,
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
  { ...commonIndexPrefix, groupId: 1, sticky: -1, createdAt: -1 },
  { partialFilterExpression: { ...commonPartialFilterExpression } }
);

Posts.addView("postsWithBannedUsers", function () {
  return {
    selector: {
      bannedUserIds: {$exists: true}
    },
  }
})
ensureIndex(Posts,
  { ...commonIndexPrefix },
  {
    partialFilterExpression: {
      ...commonPartialFilterExpression,
      bannedUserIds: {$exists: true}
    }
  }
);

Posts.addView("communityResourcePosts", function () {
  return {
    selector: {
      _id: {$in: ['bDnFhJBcLQvCY3vJW', 'qMuAazqwJvkvo8teR', 'YdcF6WbBmJhaaDqoD']}
    },
  }
})
// No index needed

Posts.addView("sunshineNewPosts", function () {
  const twoDaysAgo = moment().subtract(2, 'days').toDate();
  return {
    selector: {
      reviewedByUserId: {$exists: false},
      frontpageDate: {$ne: true },
      createdAt: {$gt: twoDaysAgo},
    },
    options: {
      sort: {
        createdAt: -1,
      }
    }
  }
})
// Covered by the same index as `new`

Posts.addView("sunshineCuratedSuggestions", function () {
  return {
    selector: {
      suggestForCuratedUserIds: {$exists:true, $ne: []},
      reviewForCuratedUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      }
    }
  }
})
ensureIndex(Posts,
  { ...commonIndexPrefix, createdAt: 1 },
  {
    partialFilterExpression: {
      ...commonPartialFilterExpression,
      suggestForCuratedUserIds: {$exists:true}, // Can't do no-empty-list filter :(
    }
  }
);

Posts.addView("afRecentDiscussionThreadsList", terms => {
  return {
    selector: {
      baseScore: {$gt:0},
      hideFrontpageComments: {$ne: true},
      af: true,
      meta: null,
      groupId: null,
      isEvent: null,
    },
    options: {
      sort: {lastCommentedAt:-1},
      limit: terms.limit || 12,
    }
  }
})
// Covered by the same index as `recentDiscussionThreadsList`

// Used in Posts.find() in various places
ensureIndex(Posts, {userId:1, createdAt:-1});

// Used in routes
ensureIndex(Posts, {legacyId: "hashed"});
ensureIndex(Posts, {agentFoundationsId: "hashed"});

// Used in checkScheduledPosts cronjob
ensureIndex(Posts, {isFuture:1, postedAt:1});

// Used in scoring aggregate query
ensureIndex(Posts, {inactive:1,postedAt:1});