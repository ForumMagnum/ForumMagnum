import { Comments } from 'meteor/example-forum';
import Users from "meteor/vulcan:users";
import LWEvents from "./collections/lwevents/collection.js";

// Comments.addDefaultView(function (terms) {
//   return {
//     selector: {deleted: {$ne: true}}
//   };
// });

// TODO Please change this to "default view ignores deleted"

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

Users.addView("topContributors", function (terms) {
  return {
    selector: { deleted: {$ne:true}},
    options: {sort: {karma: -1}, limit: 5},
  };
});

LWEvents.addView("postVisits", function (terms) {
  return {
    selector: {
      documentId: terms.postId,
      userId: terms.userId,
      name: "post-view",
      deleted: {$ne:true}
    },
    options: {sort: {createdAt: -1}, limit: terms.limit || 1},
  };
});
