import Users from "../../collections/users/collection";


Users.addView("alignmentSuggestedUsers", function () {
  return {
    selector: {
      $or: [
        {afKarma: {$gte:10}},
        {afSubmittedApplication: true},
      ],
      groups: {$nin: ['alignmentForum']},
      reviewForAlignmentForumUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      }
    }
  }
})
