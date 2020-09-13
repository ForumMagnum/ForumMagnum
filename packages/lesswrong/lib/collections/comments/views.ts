import moment from 'moment';
import * as _ from 'underscore';
import { combineIndexWithDefaultViewIndex, ensureIndex } from '../../collectionUtils';
import { forumTypeSetting } from '../../instanceSettings';
import { hideUnreviewedAuthorCommentsSettings } from '../../publicSettings';
import { viewFieldNullOrMissing } from '../../vulcan-lib';
import { Comments } from './collection';

// Auto-generated indexes from production

Comments.addDefaultView(terms => {
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
    prefix: {authorIsUnreviewed: 1},
    suffix: {deleted:1, deletedPublic:1, hideAuthor:1, userId:1, af:1},
  });
}

// Most common case: want to get all the comments on a post, filter fields and
// `limit` affects it only minimally. Best handled by a hash index on `postId`.
ensureIndex(Comments, { postId: "hashed" });

// For the user profile page
ensureIndex(Comments, { userId:1, postedAt:-1 });

Comments.addView("commentReplies", function (terms) {
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

Comments.addView("postCommentsDeleted", function (terms) {
  return {
    selector: {
      $or: null,
      deleted: null,
      postId: terms.postId
    },
    options: {sort: {deletedDate: -1, baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("allCommentsDeleted", function (terms) {
  return {
    selector: {
      $or: null,
      deleted: true,
    },
    options: {sort: {deletedDate: -1, postedAt: -1, baseScore: -1 }}
  };
});

Comments.addView("postCommentsTop", function (terms) {
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

Comments.addView("postCommentsOld", function (terms) {
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

Comments.addView("postCommentsNew", function (terms) {
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

Comments.addView("postCommentsBest", function (terms) {
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

Comments.addView("postLWComments", function (terms) {
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

Comments.addView("allRecentComments", function (terms) {
  return {
    selector: {deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("recentComments", function (terms) {
  return {
    selector: { score:{$gt:0}, deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
ensureIndex(Comments, augmentForDefaultView({ postedAt: -1 }));

Comments.addView("recentDiscussionThread", function (terms) {
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

Comments.addView("afRecentDiscussionThread", function (terms) {
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

Comments.addView("postsItemComments", function (terms) {
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

Comments.addView("sunshineNewCommentsList", function (terms) {
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
Comments.addView('questionAnswers', function (terms) {
  return {
    selector: {postId: terms.postId, answer: true},
    options: {sort: questionAnswersSort}
  };
});

// Used in legacy routes
Comments.addView("legacyIdComment", terms => ({
  selector: {
    legacyId: ""+parseInt(terms.legacyId, 36)
  },
  options: {
    limit: 1
  }
}));
ensureIndex(Comments, {legacyId: "hashed"});

// Used in scoring cron job
ensureIndex(Comments, {inactive:1,postedAt:1});

Comments.addView("sunshineNewUsersComments", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      // Don't hide deleted
      $or: null,
      // Don't hide unreviewed comments
      authorIsUnreviewed: null
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
ensureIndex(Comments, augmentForDefaultView({userId:1, postedAt:1}));

Comments.addView('repliesToAnswer', function (terms) {
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

Comments.addView('topShortform', function (terms) {
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
      ...timeRange
    },
    options: {sort: {baseScore: -1, postedAt: -1}}
  };
});

Comments.addView('shortform', function (terms) {
  return {
    selector: {
      shortform: true,
      deleted: false,
      parentCommentId: viewFieldNullOrMissing,
    },
    options: {sort: {lastSubthreadActivity: -1, postedAt: -1}}
  };
});

Comments.addView('repliesToCommentThread', function (terms) {
  return {
    selector: {
      topLevelCommentId: terms.topLevelCommentId
    },
    options: {sort: {baseScore: -1}}
  }
});

// Will be used for experimental shortform display on AllPosts page
ensureIndex(Comments, {shortform:1, topLevelCommentId: 1, lastSubthreadActivity:1, postedAt: 1, baseScore:1});

Comments.addView('shortformLatestChildren', function (terms) {
  return {
    selector: { topLevelCommentId: terms.comment._id} ,
    options: {sort: {postedAt: -1}, limit: 500}
  };
});

// Will be used for experimental shortform display on AllPosts page
ensureIndex(Comments, { topLevelCommentId: 1, postedAt: 1, baseScore:1});

Comments.addView('nominations2018', function ({userId, postId, sortBy="top"}) {
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
// Filtering comments down to ones that include "nominated for Review" so further sort indexes not necessary
ensureIndex(Comments,
  augmentForDefaultView({ nominatedForReview: 1, userId: 1, postId: 1 }),
  { name: "comments.nominations2018" }
);

Comments.addView('reviews2018', function ({userId, postId, sortBy="top"}) {
  
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
// Filtering comments down to ones that include "reviewing for review" so further sort indexes not necessary
ensureIndex(Comments,
  augmentForDefaultView({ reviewingForReview: 1, userId: 1, postId: 1 }),
  { name: "comments.reviews2018" }
);

Comments.addView('commentsOnTag', terms => ({
  selector: {
    tagId: terms.tagId,
  },
}));
ensureIndex(Comments,
  augmentForDefaultView({tagId: 1}),
  { name: "comments.tagId" }
);
