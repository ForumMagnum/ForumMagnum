import Users from "meteor/vulcan:users";

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
