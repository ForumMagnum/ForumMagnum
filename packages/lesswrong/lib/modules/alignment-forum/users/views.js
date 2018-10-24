import Users from "meteor/vulcan:users";

Users.addView('LWSunshinesList', function(terms) {
  return {
    selector: {groups:'sunshineRegiment'},
    options: {
      sort: terms.sort
    }
  }
});


Users.addView("alignmentSuggestedUsers", function () {
  return {
    selector: {
      groups: {$nin: ['alignmentForum']},
      afKarma: {$gte:10},
      reviewForAlignmentForumUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      }
    }
  }
})
