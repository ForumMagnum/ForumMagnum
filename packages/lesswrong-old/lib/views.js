
import Users from "meteor/vulcan:users";
import LWEvents from "./collections/lwevents/collection.js";

// Comments.addDefaultView(function (terms) {
//   return {
//     selector: {deleted: {$ne: true}}
//   };
// });

// TODO Please change this to "default view ignores deleted"



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
