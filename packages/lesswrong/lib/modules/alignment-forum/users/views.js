import Users from "meteor/vulcan:users";
import { ensureIndex } from '../../../collectionUtils';

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
      $or: [
        {afKarma: {$gte:10}},
        {afSubmittedApplication: true},
      ],
      reviewForAlignmentForumUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      }
    }
  }
})

ensureIndex(Users,
  { afSubmittedApplication:1, afKarma:-1, reviewForAlignmentForumUserId:1, groups:1, createdAt:1 }
);