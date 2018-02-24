import { Comments } from 'meteor/example-forum';

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

Comments.addView("postCommentsTop", function (terms) {
  return {
    selector: { postId: terms.postId },
    options: {sort: {baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("postCommentsNew", function (terms) {
  return {
    selector: { postId: terms.postId },
    options: {sort: {postedAt: -1}}
  };
});

Comments.addView("postCommentsBest", function (terms) {
  return {
    selector: { postId: terms.postId },
    options: {sort: {baseScore: -1}, postedAt: -1}
  };
});

Comments.addView("allRecentComments", function (terms) {
  return {
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});

Comments.addView("recentComments", function (terms) {
  return {
    selector: { score:{$gt:0}, deletedPublic: {$ne: true}},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
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
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
