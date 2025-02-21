import moment from 'moment';
import { combineIndexWithDefaultViewIndex, ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils';
import { forumTypeSetting, isEAForum } from '../../instanceSettings';
import { hideUnreviewedAuthorCommentsSettings } from '../../publicSettings';
import { ReviewYear } from '../../reviewUtils';
import { Comments } from './collection';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../tags/collection';
import pick from 'lodash/pick';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import { viewFieldNullOrMissing } from '@/lib/utils/viewConstants';

export const COMMENT_SORTING_MODES = new TupleSet([ 
  "top", "groupByPost", "new", "newest", "old", "oldest", "magic", "recentComments", "recentDiscussion"
] as const);

declare global {
  interface CommentsViewTerms extends ViewTermsBase {
    view?: CommentsViewName,
    postId?: string,
    userId?: string,
    tagId?: string,
    forumEventId?: string,
    relevantTagId?: string,
    maxAgeDays?: number,
    parentCommentId?: string,
    parentAnswerId?: string,
    topLevelCommentId?: string,
    legacyId?: string,
    authorIsUnreviewed?: boolean|null,
    sortBy?: CommentSortingMode,
    before?: Date|string|null,
    after?: Date|string|null,
    reviewYear?: ReviewYear
    profileTagIds?: string[],
    shortformFrontpage?: boolean,
    showCommunity?: boolean,
    commentIds?: string[],
  }
  
  /**
   * Comment sorting mode, a string which gets translated into a mongodb sort
   * order. Not every mode is shown in the UI in every context. Corresponds to
   * `sortings` (below).
   *
   * new/newest, old/oldest, and recentComments/recentDiscussion are synonyms.
   * In past versions, different subsets of these depending on whether you were
   * using an answers view, a subforum view, or something else.
   */
  type CommentSortingMode = UnionOf<typeof COMMENT_SORTING_MODES>;
}

Comments.addDefaultView((terms: CommentsViewTerms, _, context?: ResolverContext) => {
  const validFields = pick(terms, 'userId', 'authorIsUnreviewed');

  const alignmentForum = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
  const hideSince = hideUnreviewedAuthorCommentsSettings.get()
  
  const notDeletedOrDeletionIsPublic = {
    $or: [{$and: [{deleted: true}, {deletedPublic: true}]}, {deleted: false}],
  };
  
  // When we're hiding unreviewed comments, we allow comments that meet any of:
  //  * The author is reviewed
  //  * The comment was posted before the hideSince date
  //  * The comment was posted by the current user
  // Do not run this on the client (ie: Mingo), because we will not have the
  // resolver context, and return unreviewed comments to ensure cache is
  // properly invalidated.
  // We set `{$ne: true}` instead of `false` to allow for comments that haven't
  // had the default value set yet (ie: those created by the frontend
  // immediately prior to appearing)
  const shouldHideNewUnreviewedAuthorComments = (hideSince && bundleIsServer);
  const hideNewUnreviewedAuthorComments =
    (shouldHideNewUnreviewedAuthorComments && (
      {$or: [
        {authorIsUnreviewed: {$ne: true}},
        {postedAt: {$lt: new Date(hideSince)}},
        ...(context?.currentUser?._id ? [{userId: context?.currentUser?._id}] : [])
      ]}
    )
  );
  
  return ({
    selector: {
      ...(shouldHideNewUnreviewedAuthorComments
        ? {$and: [
            hideNewUnreviewedAuthorComments,
            notDeletedOrDeletionIsPublic
          ]}
        : notDeletedOrDeletionIsPublic
      ),
      hideAuthor: terms.userId ? false : undefined,
      ...(terms.commentIds && {_id: {$in: terms.commentIds}}),
      ...alignmentForum,
      ...validFields,
      debateResponse: { $ne: true },
      rejected: { $ne: true }
    },
    options: {
      sort: {postedAt: -1},
    }
  });
})

// Spread into a view to remove the part of the default view selector that hides deleted and
// unreviewed comments.
const dontHideDeletedAndUnreviewed = {
  $or: null,
  $and: null,
  rejected: null
};


const sortings: Record<CommentSortingMode,MongoSelector<DbComment>> = {
  "top": { baseScore: -1 },
  "magic": { score: -1 },
  "groupByPost": { postId: 1 },
  "new": { postedAt: -1 },
  "newest": { postedAt: -1 },
  "old": { postedAt: 1 },
  "oldest": { postedAt: 1 },
  recentComments: { lastSubthreadActivity: -1 },
  /** DEPRECATED */
  recentDiscussion: { lastSubthreadActivity: -1 },
}

export function augmentForDefaultView(indexFields: MongoIndexKeyObj<DbComment>)
{
  return combineIndexWithDefaultViewIndex({
    viewFields: indexFields,
    prefix: {},
    suffix: {authorIsUnreviewed: 1, deleted:1, deletedPublic:1, hideAuthor:1, userId:1, af:1, postedAt:1, debateResponse:1},
  });
}

// Most common case: want to get all the comments on a post, filter fields and
// `limit` affects it only minimally. Best handled by a hash index on `postId`.
ensureIndex(Comments, { postId: "hashed" });

// For the user profile page
ensureIndex(Comments, { userId:1, postedAt:-1 });

Comments.addView("commentReplies", (terms: CommentsViewTerms) => {
  return {
    selector: {
      parentCommentId: terms.parentCommentId,
    },
    options: {
      sort: {postedAt: -1}
    }
  }
})
ensureIndex(Comments, { parentCommentId: "hashed" });

Comments.addView("postCommentsDeleted", (terms: CommentsViewTerms) => {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      deleted: null,
      postId: terms.postId
    },
    options: {sort: {deletedDate: -1, baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("allCommentsDeleted", (terms: CommentsViewTerms) => {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      deleted: true,
    },
    options: {sort: {deletedDate: -1, postedAt: -1, baseScore: -1 }}
  };
});

Comments.addView("checkedByModGPT", (terms: CommentsViewTerms) => {
  return {
    selector: {
      modGPTAnalysis: {$exists: true}
    },
    options: {sort: {postedAt: -1}}
  };
});

Comments.addView("postCommentsTop", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {promoted: -1, deleted: 1, baseScore: -1, postedAt: -1}},

  };
});
ensureIndex(Comments,
  augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, baseScore:-1, postedAt:-1 }),
  { name: "comments.top_comments" }
);

Comments.addView("postCommentsRecentReplies", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {lastSubthreadActivity: -1, promoted: -1, deleted: 1, baseScore: -1, postedAt: -1}},

  };
});
ensureIndex(Comments,
  augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, lastSubthreadActivity: -1, baseScore:-1, postedAt:-1 }),
  { name: "comments.recent_replies" }
);

Comments.addView("postCommentsMagic", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {promoted: -1, deleted: 1, score: -1, postedAt: -1}},

  };
});
ensureIndex(Comments,
  augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, score:-1, postedAt:-1 }),
  { name: "comments.magic_comments" }
);

Comments.addView("afPostCommentsTop", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {promoted: -1, deleted: 1, afBaseScore: -1, postedAt: -1}},

  };
});
ensureIndex(Comments,
  augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, afBaseScore:-1, postedAt:-1 }),
  { name: "comments.af_top_comments" }
);

Comments.addView("postCommentsOld", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {deleted: 1, postedAt: 1}},
    parentAnswerId: viewFieldNullOrMissing
  };
});
// Uses same index as postCommentsNew

Comments.addView("postCommentsNew", (terms: CommentsViewTerms) => {
  if (!terms.postId)
    throw new Error("Invalid postCommentsNew view: postId is required");
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {deleted: 1, postedAt: -1}}
  };
});
ensureIndex(Comments,
  augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, postedAt:-1 }),
  { name: "comments.new_comments" }
);

Comments.addView("postCommentsBest", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {promoted: -1, deleted: 1, baseScore: -1}, postedAt: -1}
  };
});
// Same as postCommentsTop

Comments.addView("postLWComments", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      af: null,
      answer: false,
      parentAnswerId: viewFieldNullOrMissing
    },
    options: {sort: {promoted: -1, deleted: 1, baseScore: -1, postedAt: -1}}
  };
})

export const profileCommentsSortings: Partial<Record<CommentSortingMode,MongoSelector<DbComment>>> = {
  "new" :  { isPinnedOnProfile: -1, postedAt: -1},
  "magic": { score: -1 },
  "top" : { baseScore: -1},
  "old": {postedAt: 1},
  "recentComments": { lastSubthreadActivity: -1 },
} as const;

// This view is DEPRECATED, use profileComments instead. This is here so that old links still work (plus greaterwrong etc)
Comments.addView("profileRecentComments", (terms: CommentsViewTerms) => {
  return {
    selector: {deletedPublic: false},
    options: {sort: {isPinnedOnProfile: -1, postedAt: -1}, limit: terms.limit || 5},
  };
})

Comments.addView("profileComments", (terms: CommentsViewTerms) => {
  const sortBy = terms.sortBy ?? "new"
  
  return {
    selector: {deletedPublic: false},
    options: {sort: profileCommentsSortings[sortBy], limit: terms.limit || 5},
  };
})

ensureIndex(Comments, augmentForDefaultView({ userId: 1, isPinnedOnProfile: -1, postedAt: -1 }))

Comments.addView("allRecentComments", (terms: CommentsViewTerms) => {
  return {
    selector: {deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("recentComments", (terms: CommentsViewTerms) => {
  return {
    selector: { score:{$gt:0}, deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
ensureIndex(Comments, augmentForDefaultView({ postedAt: -1 }));

Comments.addView("afSubmissions", (terms: CommentsViewTerms) => {
  return {
    selector: {
      af: false,
      suggestForAlignmentUserIds: terms.userId,
      deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("rejected", (terms: CommentsViewTerms) => {
  return {
    selector: {...dontHideDeletedAndUnreviewed, rejected: true},
    options: {sort: { postedAt: -1}, limit: terms.limit || 20},
  };
})
ensureIndex(Comments, augmentForDefaultView({ rejected: -1, authorIsUnreviewed:1, postedAt: 1 }));

// As of 2021-10, JP is unsure if this is used
Comments.addView("recentDiscussionThread", (terms: CommentsViewTerms) => {
  // The forum has fewer comments, and so wants a more expansive definition of
  // "recent"
  const eighteenHoursAgo = moment().subtract(forumTypeSetting.get() === 'EAForum' ? 36 : 18, 'hours').toDate();
  return {
    selector: {
      postId: terms.postId,
      score: {$gt:0},
      deletedPublic: false,
      postedAt: {$gt: eighteenHoursAgo}
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5}
  };
})
// Uses same index as postCommentsNew

Comments.addView("afRecentDiscussionThread", (terms: CommentsViewTerms) => {
  const sevenDaysAgo = moment().subtract(7, 'days').toDate();
  return {
    selector: {
      postId: terms.postId,
      score: {$gt:0}, 
      deletedPublic: false,
      postedAt: {$gt: sevenDaysAgo},
      af: true,
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5}
  };
})

Comments.addView("postsItemComments", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      deleted: false,
      postedAt: terms.after ? {$gt: new Date(terms.after)} : null,
      ...(!isEAForum && {score: {$gt: 0}}),
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 15},
  };
});

Comments.addView("sunshineNewCommentsList", (terms: CommentsViewTerms) => {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      $or: [
        {$and: []},
        {needsReview: true},
        {baseScore: {$lte:0}}
      ],
      reviewedByUserId: {$exists:false},
      deleted: false,
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

export const questionAnswersSortings: Record<CommentSortingMode,MongoSelector<DbComment>> = {
  ...sortings,
  "top": {promoted: -1, baseScore: -1, postedAt: -1},
  "magic": {promoted: -1, score: -1, postedAt: -1},
} as const;

Comments.addView('questionAnswers', (terms: CommentsViewTerms) => {
  return {
    selector: {postId: terms.postId, answer: true},
    options: {sort: questionAnswersSortings[terms.sortBy || "top"]}
  };
});

// Used in legacy routes
Comments.addView("legacyIdComment", (terms: CommentsViewTerms) => {
  if (!terms.legacyId) throw new Error("Missing view argument: legacyId");
  const legacyId = parseInt(terms.legacyId, 36)
  if (isNaN(legacyId)) throw new Error("Invalid view argument: legacyId must be base36, was "+terms.legacyId);
  
  return {
    selector: {
      legacyId: ""+legacyId
    },
    options: {
      limit: 1
    }
  };
});
ensureIndex(Comments, {legacyId: "hashed"});

// Used in scoring cron job
ensureIndex(Comments, {inactive:1,postedAt:1});

Comments.addView("sunshineNewUsersComments", (terms: CommentsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      // Don't hide deleted
      ...dontHideDeletedAndUnreviewed,
      // Don't hide unreviewed comments
      authorIsUnreviewed: null
    },
    options: {sort: {postedAt: -1}},
  };
});
ensureIndex(Comments, augmentForDefaultView({userId:1, postedAt:1}));

Comments.addView("defaultModeratorResponses", (terms: CommentsViewTerms) => {
  return {
    selector: {
      tagId: terms.tagId,
    }
  };
});


Comments.addView('repliesToAnswer', (terms: CommentsViewTerms) => {
  return {
    selector: {parentAnswerId: terms.parentAnswerId},
    options: {sort: {baseScore: -1}}
  };
});
ensureIndex(Comments, augmentForDefaultView({parentAnswerId:1, baseScore:-1}));

Comments.addView('answersAndReplies', (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      $or: [
        { answer: true },
        { parentAnswerId: {$exists: true} },
      ],
    },
    options: {sort: questionAnswersSortings[terms.sortBy || "top"]}
  };
});

// Used in moveToAnswers
ensureIndex(Comments, {topLevelCommentId:1});

// Used in findCommentByLegacyAFId
ensureIndex(Comments, {agentFoundationsId:1});

Comments.addView('topShortform', (terms: CommentsViewTerms) => {
  const timeRange = ((terms.before || terms.after)
    ? { postedAt: {
      ...(terms.before && {$lt: new Date(terms.before)}),
      ...(terms.after && {$gte: new Date(terms.after)})
    } }
    : null
  );

  const shortformFrontpage =
    isEAForum && typeof terms.shortformFrontpage === "boolean"
      ? {shortformFrontpage: terms.shortformFrontpage}
      : {};

  return {
    selector: {
      shortform: true,
      parentCommentId: viewFieldNullOrMissing,
      deleted: false,
      ...timeRange,
      ...shortformFrontpage,
    },
    options: {sort: {baseScore: -1, postedAt: -1}}
  };
});

Comments.addView('shortform', (terms: CommentsViewTerms) => {
  return {
    selector: {
      shortform: true,
      deleted: false,
      parentCommentId: viewFieldNullOrMissing,
    },
    options: {sort: {lastSubthreadActivity: -1, postedAt: -1}}
  };
});

Comments.addView('shortformFrontpage', (terms: CommentsViewTerms, _, context?: ResolverContext) => {
  const twoHoursAgo = moment().subtract(2, 'hours').toDate();
  const maxAgeDays = terms.maxAgeDays ?? 5;
  const currentUserId = context?.currentUser?._id;
  return {
    selector: {
      shortform: true,
      shortformFrontpage: true,
      deleted: false,
      rejected: {$ne: true},
      parentCommentId: viewFieldNullOrMissing,
      createdAt: {$gt: moment().subtract(maxAgeDays, 'days').toDate()},
      $and: [
        !terms.showCommunity
          ? {
            relevantTagIds: {$ne: EA_FORUM_COMMUNITY_TOPIC_ID},
          }
          : {},
        !!terms.relevantTagId
          ? {
            relevantTagIds: terms.relevantTagId,
          }
          : {},
        {
          $or: [
            {authorIsUnreviewed: false},
            {userId: currentUserId},
          ]
        },
      ],
      // Quick takes older than 2 hours must have at least 1 karma, quick takes
      // younger than 2 hours must have at least -5 karma
      $or: [
        {
          baseScore: {$gte: 1},
          createdAt: {$lt: twoHoursAgo},
        },
        {
          baseScore: {$gte: -5},
          createdAt: {$gte: twoHoursAgo},
        },
      ],
    },
    options: {sort: {score: -1, lastSubthreadActivity: -1, postedAt: -1}}
  };
});

Comments.addView('repliesToCommentThread', (terms: CommentsViewTerms) => {
  return {
    selector: {
      topLevelCommentId: terms.topLevelCommentId
    },
    options: {sort: {baseScore: -1}}
  }
});

// Will be used for experimental shortform display on AllPosts page
ensureIndex(Comments, {shortform:1, topLevelCommentId: 1, lastSubthreadActivity:1, postedAt: 1, baseScore:1});

Comments.addView('shortformLatestChildren', (terms: CommentsViewTerms) => {
  return {
    selector: { topLevelCommentId: terms.topLevelCommentId} ,
    options: {sort: {postedAt: -1}, limit: 500}
  };
});

// Will be used for experimental shortform display on AllPosts page
ensureIndex(Comments, { topLevelCommentId: 1, postedAt: 1, baseScore:1});

Comments.addView('nominations2018', ({userId, postId, sortBy="top"}: CommentsViewTerms) => {
  return {
    selector: { 
      userId, 
      postId, 
      nominatedForReview: "2018",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
});

Comments.addView('nominations2019', function ({userId, postId, sortBy="top"}) {
  return {
    selector: { 
      userId, 
      postId, 
      nominatedForReview: "2019",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
});
// Filtering comments down to ones that include "nominated for Review" so further sort indexes not necessary
ensureIndex(Comments,
  augmentForDefaultView({ nominatedForReview: 1, userId: 1, postId: 1 }),
  { name: "comments.nominations2018" }
);

Comments.addView('reviews2018', ({userId, postId, sortBy="top"}: CommentsViewTerms) => {
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: "2018",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
});

Comments.addView('reviews2019', function ({userId, postId, sortBy="top"}) {
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: "2019",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
});

// TODO: try to refactor this
Comments.addView('reviews', function ({userId, postId, reviewYear, sortBy="top"}) {
  const reviewingForReviewQuery = reviewYear ? reviewYear+"" : {$ne: null}
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: reviewingForReviewQuery,
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
});

// Filtering comments down to ones that include "reviewing for review" so further sort indexes not necessary
ensureIndex(Comments,
  augmentForDefaultView({ reviewingForReview: 1, userId: 1, postId: 1 }),
  { name: "comments.reviews2018" }
);
ensureIndex(Comments,
  augmentForDefaultView({tagId: 1}),
  { name: "comments.tagId" }
);

// TODO merge with subforumFeedSortings
export const subforumSorting: Record<CommentSortingMode,MongoSelector<DbComment>> = {
  ...sortings,
}
export const subforumDiscussionDefaultSorting = "recentComments"

Comments.addView('tagDiscussionComments', (terms: CommentsViewTerms) => ({
  selector: {
    tagId: terms.tagId,
    tagCommentType: "DISCUSSION"
  },
}));

Comments.addView('tagSubforumComments', ({tagId, sortBy=subforumDiscussionDefaultSorting}: CommentsViewTerms, _, context?: ResolverContext) => {
  const sorting = subforumSorting[sortBy] || subforumSorting.new
  return {
  selector: {
    $or: [{tagId: tagId, tagCommentType: "SUBFORUM"}, {relevantTagIds: tagId}],
    topLevelCommentId: viewFieldNullOrMissing,
    deleted: false,
  },
  options: {
    sort: sorting,
  },
}});
ensureIndex(Comments, augmentForDefaultView({ topLevelCommentId: 1, tagCommentType: 1, tagId:1 }));

// DEPRECATED (will be deleted once there are no more old clients floating around)
// For 'Discussion from your subforums' on the homepage
Comments.addView('latestSubforumDiscussion', (terms: CommentsViewTerms) => {
  return {
    selector: {
      tagId: {$in: terms.profileTagIds ?? []},
      tagCommentType: "SUBFORUM",
      topLevelCommentId: viewFieldNullOrMissing,
      lastSubthreadActivity: {$gt: moment().subtract(2, 'days').toDate()}
    },
    options: {
      sort: subforumSorting.recentComments,
      limit: 3,
    },
  }
});

Comments.addView('moderatorComments', (terms: CommentsViewTerms) => ({
  selector: {
    moderatorHat: true,
  },
  options: {
    sort: {postedAt: -1},
  },
}));
ensureIndex(Comments,
  augmentForDefaultView({moderatorHat: 1}),
  { name: "comments.moderatorHat" }
);

Comments.addView('debateResponses', (terms: CommentsViewTerms) => ({
  selector: {
    postId: terms.postId,
    debateResponse: true
  },
  options: {
    sort: { 
      postedAt: 1
     }
  }
}));

Comments.addView("recentDebateResponses", (terms: CommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      debateResponse: true,
      deleted: false,
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 7},
  };
});

Comments.addView('forumEventComments', (terms: CommentsViewTerms) => {
  return {
    selector: {
      forumEventId: terms.forumEventId,
      ...(terms.userId && { userId: terms.userId }),
      deleted: false,
    },
    options: {
      sort: { postedAt: -1 },
    },
  };
});

ensureIndex(Comments, augmentForDefaultView({ forumEventId: 1, userId: 1, postedAt: -1 }));


// For allowing `CommentsRepo.getPromotedCommentsOnPosts` to use an index-only scan, which is much faster than an index scan followed by pulling each comment from disk to get its "promotedAt".
void ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Comments_postId_promotedAt"
  ON "Comments" ("postId", "promotedAt")
  WHERE "promotedAt" IS NOT NULL;
`);

// For allowing `TagsRepo.getUserTopTags` to use an index-only scan, since given previous indexes it needed to pull all the comments to get their "postId".
void ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Comments_userId_postId_postedAt"
  ON "Comments" ("userId", "postId", "postedAt");
`);

// Exists for the sake of `CommentsRepo.getPopularComments`, which otherwise takes several seconds to run on a cold cache
// Note that while it'll continue to use the index if you _increase_ the baseScore requirement above 15, it won't if you decrease it
// The other conditions in the query could also have been included in the partial index requirements,
// but they made a trivial difference so the added complexity (and lack of generalizability) didn't seem worth it
void ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_popular_comments
  ON "Comments" ("postId", "baseScore" DESC, "postedAt" DESC)
  WHERE ("baseScore" >= 15)
`);
