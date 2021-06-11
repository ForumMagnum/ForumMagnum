import moment from 'moment';
import * as _ from 'underscore';
import { combineIndexWithDefaultViewIndex, ensureIndex, ensurePgIndex } from '../../collectionUtils';
import { forumTypeSetting } from '../../instanceSettings';
import { hideUnreviewedAuthorCommentsSettings } from '../../publicSettings';
import { viewFieldNullOrMissing } from '../../vulcan-lib';
import { Comments } from './collection';

declare global {
  interface CommentsViewTerms extends ViewTermsBase {
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
  }
}

Comments.addDefaultView((terms: CommentsViewTerms) => {
  const validFields = _.pick(terms, 'userId', 'authorIsUnreviewed');

  const alignmentForum = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
  // We set `{$ne: true}` instead of `false` to allow for comments that haven't
  // had the default value set yet (ie: those created by the frontend
  // immediately prior to appearing)
  const hideUnreviewedAuthorComments = hideUnreviewedAuthorCommentsSettings.get()
    ? {authorIsUnreviewed: {$ne: true}}
    : {}
  return ({
    selector: {
      $or: [{$and: [{deleted: true}, {deletedPublic: true}]}, {deleted: false}],
      hideAuthor: terms.userId ? false : undefined,
      ...alignmentForum,
      ...hideUnreviewedAuthorComments,
      ...validFields,
    },
    options: {
      sort: {postedAt: -1},
    }
  });
})

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
    suffix: {authorIsUnreviewed: 1, deleted:1, deletedPublic:1, hideAuthor:1, userId:1, af:1},
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
      $or: null,
      deleted: null,
      postId: terms.postId
    },
    options: {sort: {deletedDate: -1, baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("allCommentsDeleted", (terms: CommentsViewTerms) => {
  return {
    selector: {
      $or: null,
      deleted: true,
    },
    options: {sort: {deletedDate: -1, postedAt: -1, baseScore: -1 }}
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

Comments.addView("recentDiscussionThread", (terms: CommentsViewTerms) => {
  const eighteenHoursAgo = moment().subtract(18, 'hours').toDate();
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
      score: {$gt: 0},
      postedAt: terms.after ? {$gt: new Date(terms.after)} : null
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 15},
  };
});

Comments.addView("sunshineNewCommentsList", (terms: CommentsViewTerms) => {
  return {
    selector: {
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

export const questionAnswersSort = {promoted: -1, baseScore: -1, postedAt: -1}
Comments.addView('questionAnswers', (terms: CommentsViewTerms) => {
  return {
    selector: {postId: terms.postId, answer: true},
    options: {sort: questionAnswersSort}
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
      $or: null,
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
ensureIndex(Comments, augmentForDefaultView({tagId:1}));


Comments.addView('repliesToAnswer', (terms: CommentsViewTerms) => {
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

Comments.addView('topShortform', (terms: CommentsViewTerms) => {
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
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
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
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
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
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
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
      sort: { ...sortings[sortBy], top: -1, postedAt: -1 }
    }
  };
});
// Filtering comments down to ones that include "reviewing for review" so further sort indexes not necessary
ensureIndex(Comments,
  augmentForDefaultView({ reviewingForReview: 1, userId: 1, postId: 1 }),
  { name: "comments.reviews2018" }
);

Comments.addView('commentsOnTag', (terms: CommentsViewTerms) => ({
  selector: {
    tagId: terms.tagId,
  },
}));
ensureIndex(Comments,
  augmentForDefaultView({tagId: 1}),
  { name: "comments.tagId" }
);

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

ensurePgIndex(Comments, "commentsOnPost", "USING BTREE ((json->>'postId'), (json->>'postedAt'), ((json->'deleted')::boolean), ((json->'deletedPublic')::boolean), ((json->'score')::float))");
