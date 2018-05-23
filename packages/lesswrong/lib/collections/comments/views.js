import { Comments } from 'meteor/example-forum';
import moment from 'moment';

Comments.addDefaultView(terms => {
  const validFields = _.pick(terms, 'userId');
  return ({
    selector: {
      $or: [{$and: [{deleted: true}, {deletedPublic: true}]}, {deleted: {$ne: true}}],
      ...validFields,
    }
  });
})

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
    selector: { postId: terms.postId },
    options: {sort: {deleted: 1, baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("postCommentsNew", function (terms) {
  return {
    selector: { postId: terms.postId },
    options: {sort: {deleted: 1, postedAt: -1}}
  };
});

Comments.addView("postCommentsBest", function (terms) {
  return {
    selector: { postId: terms.postId },
    options: {sort: {deleted: 1, baseScore: -1}, postedAt: -1}
  };
});

Comments.addView("allRecentComments", function (terms) {
  return {
    selector: {deletedPublic: {$ne:true}},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("recentComments", function (terms) {
  return {
    selector: { score:{$gt:0}, deletedPublic: {$ne: true}},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("recentDiscussionThread", function (terms) {
  const eighteenHoursAgo = new Date(new Date().getTime()-(18*60*60*1000));
  return {
    selector: {
      postId: terms.postId,
      score: {$gt:0},
      deletedPublic: {$ne: true},
      postedAt: {$gt: eighteenHoursAgo}
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5}
  };
})

Comments.addView("topRecentComments", function (terms) {
  return {
    selector: { score:{$gt:0}, postId:terms.postId},
    options: {sort: {baseScore: -1}, limit: terms.limit || 3},
  };
});

Comments.addView("postCommentsUnread", function (terms) {
  return {
    selector: {
      postId: terms.postId,
      deleted: {$ne: true }
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 15},
  };
});

Comments.addView("sunshineNewCommentsList", function (terms) {
  const twoDaysAgo = moment().subtract(2, 'days').toDate();
  return {
    selector: {
      baseScore: {$lt:2},
      reviewedByUserId: {$exists:false},
      deletedPublic: {$ne: true},
      postedAt: {$gt: twoDaysAgo},
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
