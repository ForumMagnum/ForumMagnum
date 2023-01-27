import moment from 'moment';
import { combineIndexWithDefaultViewIndex, ensureIndex } from '../../collectionIndexUtils';
import { forumTypeSetting } from '../../instanceSettings';
import { hideUnreviewedAuthorCommentsSettings } from '../../publicSettings';
import { ReviewYear } from '../../reviewUtils';
import { viewFieldNullOrMissing } from '../../vulcan-lib';
import { Comments } from './collection';
import pick from 'lodash/pick';

interface CommentsByIdsViewTerms extends ViewTermsBase {
  view?: 'commentsByIds';
  commentIds: string[];
}

declare global {
  interface OldCommentsViewTerms extends ViewTermsBase {
    view?: CommentsViewName,
    postId?: string,
    userId?: string,
    tagId?: string,
    parentCommentId?: string,
    parentAnswerId?: string,
    topLevelCommentId?: string,
    legacyId?: string,
    authorIsUnreviewed?: boolean|null,
    sortBy?: string,
    before?: Date|string|null,
    after?: Date|string|null,
    reviewYear?: ReviewYear
    profileTagIds?: string[],
  }

  type CommentsViewTerms =
    | OldCommentsViewTerms
    | CommentsByIdsViewTerms
}

Comments.addDefaultView((terms: OldCommentsViewTerms, _, context?: ResolverContext) => {
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
      ...alignmentForum,
      ...validFields,
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
};


const sortings = {
  "top" : { baseScore: -1},
  "groupByPost" : {postId: 1},
  "new" :  { postedAt: -1}
}

export function augmentForDefaultView(indexFields)
{
  return combineIndexWithDefaultViewIndex({
    viewFields: indexFields,
    prefix: {},
    suffix: {authorIsUnreviewed: 1, deleted:1, deletedPublic:1, hideAuthor:1, userId:1, af:1, postedAt:1},
  });
}

// Most common case: want to get all the comments on a post, filter fields and
// `limit` affects it only minimally. Best handled by a hash index on `postId`.
ensureIndex(Comments, { postId: "hashed" });

// For the user profile page
ensureIndex(Comments, { userId:1, postedAt:-1 });

Comments.addView("commentReplies", (terms: OldCommentsViewTerms) => {
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

Comments.addView("postCommentsDeleted", (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      deleted: null,
      postId: terms.postId
    },
    options: {sort: {deletedDate: -1, baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("allCommentsDeleted", (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      deleted: true,
    },
    options: {sort: {deletedDate: -1, postedAt: -1, baseScore: -1 }}
  };
});

Comments.addView("postCommentsTop", (terms: OldCommentsViewTerms) => {
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

Comments.addView("afPostCommentsTop", (terms: OldCommentsViewTerms) => {
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

Comments.addView("postCommentsOld", (terms: OldCommentsViewTerms) => {
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

Comments.addView("postCommentsNew", (terms: OldCommentsViewTerms) => {
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

Comments.addView("postCommentsBest", (terms: OldCommentsViewTerms) => {
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

Comments.addView("postLWComments", (terms: OldCommentsViewTerms) => {
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

Comments.addView("profileRecentComments", (terms: OldCommentsViewTerms) => {
  return {
    selector: {deletedPublic: false},
    options: {sort: {isPinnedOnProfile: -1, postedAt: -1}, limit: terms.limit || 5},
  };
})
ensureIndex(Comments, augmentForDefaultView({ isPinnedOnProfile: -1, postedAt: -1 }))

Comments.addView("allRecentComments", (terms: OldCommentsViewTerms) => {
  return {
    selector: {deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("recentComments", (terms: OldCommentsViewTerms) => {
  return {
    selector: { score:{$gt:0}, deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
ensureIndex(Comments, augmentForDefaultView({ postedAt: -1 }));

Comments.addView("afSubmissions", (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      af: false,
      suggestForAlignmentUserIds: terms.userId,
      deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

// As of 2021-10, JP is unsure if this is used
Comments.addView("recentDiscussionThread", (terms: OldCommentsViewTerms) => {
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

Comments.addView("afRecentDiscussionThread", (terms: OldCommentsViewTerms) => {
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

Comments.addView("postsItemComments", (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      deleted: false,
      score: {$gt: 0},
      postedAt: terms.after ? {$gt: new Date(terms.after)} : null
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 15},
  };
});

Comments.addView("sunshineNewCommentsList", (terms: OldCommentsViewTerms) => {
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

export const questionAnswersSortings = {
  "top": {promoted: -1, baseScore: -1, postedAt: -1},
  "newest": {postedAt: -1},
  "oldest": {postedAt: 1},
} as const;

Comments.addView('questionAnswers', (terms: OldCommentsViewTerms) => {
  return {
    selector: {postId: terms.postId, answer: true},
    options: {sort: questionAnswersSortings[terms.sortBy || "top"]}
  };
});

// Used in legacy routes
Comments.addView("legacyIdComment", (terms: OldCommentsViewTerms) => {
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

Comments.addView("sunshineNewUsersComments", (terms: OldCommentsViewTerms) => {
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

Comments.addView("defaultModeratorResponses", (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      tagId: terms.tagId,
    }
  };
});


Comments.addView('repliesToAnswer', (terms: OldCommentsViewTerms) => {
  return {
    selector: {parentAnswerId: terms.parentAnswerId},
    options: {sort: {baseScore: -1}}
  };
});
ensureIndex(Comments, augmentForDefaultView({parentAnswerId:1, baseScore:-1}));

// Used in moveToAnswers
ensureIndex(Comments, {topLevelCommentId:1});

// Used in findCommentByLegacyAFId
ensureIndex(Comments, {agentFoundationsId:1});

Comments.addView('topShortform', (terms: OldCommentsViewTerms) => {
  const timeRange = ((terms.before || terms.after)
    ? { postedAt: {
      ...(terms.before && {$lt: new Date(terms.before)}),
      ...(terms.after && {$gte: new Date(terms.after)})
    } }
    : null
  );

  return {
    selector: {
      shortform: true,
      parentCommentId: viewFieldNullOrMissing,
      deleted: false,
      ...timeRange
    },
    options: {sort: {baseScore: -1, postedAt: -1}}
  };
});

Comments.addView('shortform', (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      shortform: true,
      deleted: false,
      parentCommentId: viewFieldNullOrMissing,
    },
    options: {sort: {lastSubthreadActivity: -1, postedAt: -1}}
  };
});

Comments.addView('repliesToCommentThread', (terms: OldCommentsViewTerms) => {
  return {
    selector: {
      topLevelCommentId: terms.topLevelCommentId
    },
    options: {sort: {baseScore: -1}}
  }
});

// Will be used for experimental shortform display on AllPosts page
ensureIndex(Comments, {shortform:1, topLevelCommentId: 1, lastSubthreadActivity:1, postedAt: 1, baseScore:1});

Comments.addView('shortformLatestChildren', (terms: OldCommentsViewTerms) => {
  return {
    selector: { topLevelCommentId: terms.topLevelCommentId} ,
    options: {sort: {postedAt: -1}, limit: 500}
  };
});

// Will be used for experimental shortform display on AllPosts page
ensureIndex(Comments, { topLevelCommentId: 1, postedAt: 1, baseScore:1});

Comments.addView('nominations2018', ({userId, postId, sortBy="top"}: OldCommentsViewTerms) => {
  return {
    selector: { 
      userId, 
      postId, 
      nominatedForReview: "2018",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
    }
  };
});

Comments.addView('nominations2019', function ({userId, postId, sortBy="top"}: OldCommentsViewTerms) {
  return {
    selector: { 
      userId, 
      postId, 
      nominatedForReview: "2019",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
    }
  };
});
// Filtering comments down to ones that include "nominated for Review" so further sort indexes not necessary
ensureIndex(Comments,
  augmentForDefaultView({ nominatedForReview: 1, userId: 1, postId: 1 }),
  { name: "comments.nominations2018" }
);

Comments.addView('reviews2018', ({userId, postId, sortBy="top"}: OldCommentsViewTerms) => {
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: "2018",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
    }
  };
});

Comments.addView('reviews2019', function ({userId, postId, sortBy="top"}: OldCommentsViewTerms) {
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: "2019",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
    }
  };
});

// TODO: try to refactor this
Comments.addView('reviews', function ({userId, postId, reviewYear, sortBy="top"}: OldCommentsViewTerms) {
  const reviewingForReviewQuery = reviewYear ? reviewYear+"" : {$ne: null}
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: reviewingForReviewQuery,
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
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
export const subforumSorting = {
  magic: { score: -1 },
  new: { postedAt: -1 },
  old: { postedAt: 1 },
  top: { baseScore: -1 },
  recentComments: { lastSubthreadActivity: -1 },
  recentDiscussion: { lastSubthreadActivity: -1 }, // DEPRECATED
}
export const subforumDiscussionDefaultSorting = "recentComments"

Comments.addView('tagDiscussionComments', (terms: OldCommentsViewTerms) => ({
  selector: {
    tagId: terms.tagId,
    tagCommentType: "DISCUSSION"
  },
}));

Comments.addView('tagSubforumComments', ({tagId, sortBy=subforumDiscussionDefaultSorting}: OldCommentsViewTerms, _, context?: ResolverContext) => {
  const sorting = subforumSorting[sortBy] || subforumSorting.new
  return {
  selector: {
    tagId: tagId,
    tagCommentType: "SUBFORUM",
    topLevelCommentId: viewFieldNullOrMissing,
    deleted: false,
  },
  options: {
    sort: sorting,
  },
}});
ensureIndex(Comments, augmentForDefaultView({ topLevelCommentId: 1, tagCommentType: 1, tagId:1 }));

// For 'Discussion from your subforums' on the homepage
Comments.addView('latestSubforumDiscussion', (terms: OldCommentsViewTerms) => {
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

Comments.addView('moderatorComments', (terms: OldCommentsViewTerms) => ({
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

Comments.addView('commentsByIds', (terms: CommentsByIdsViewTerms) => ({
  selector: {
    _id: { $in: terms.commentIds }
  }
}));
