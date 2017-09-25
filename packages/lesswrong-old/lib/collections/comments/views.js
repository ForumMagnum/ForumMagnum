import { Comments } from 'meteor/example-forum';

Comments.addDefaultView(terms => {
  const validFields = _.pick(terms, 'userId');
  return ({
    selector: {
      ...validFields,
    }
  });
})


Comments.addView("postCommentsDeleted", function (terms) {
  return {
    selector: {postId: terms.postId},
    options: {sort: {deleted:-1}}
  };
});

Comments.addView("postCommentsTop", function (terms) {
  return {
    selector: { postId: terms.postId, deleted: {$ne:true}},
    options: {sort: {baseScore: -1, postedAt: -1}}
  };
});

Comments.addView("postCommentsNew", function (terms) {
  return {
    selector: { postId: terms.postId, deleted: {$ne:true}},
    options: {sort: {postedAt: -1}}
  };
});

Comments.addView("postCommentsBest", function (terms) {
  return {
    selector: { postId: terms.postId, deleted: {$ne:true}},
    options: {sort: {baseScore: -1}, postedAt: -1}
  };
});

Comments.addView("recentComments", function (terms) {
  return {
    selector: { deleted:{$ne:true}},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
});
