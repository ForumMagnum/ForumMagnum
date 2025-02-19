import Users from "../../collections/users/collection";
import { ensureIndex } from '../../collectionIndexUtils';


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

ensureIndex(Users,
  { afKarma:1, reviewForAlignmentForumUserId:1, groups:1, createdAt:1 }
);
ensureIndex(Users,
  { afSubmittedApplication:1, reviewForAlignmentForumUserId:1, groups:1, createdAt:1 }
);
