import { Posts } from '../../../collections/posts';

Posts.addView("alignmentSuggestedPosts", function () {
  return {
    selector: {
      af: {$ne: true},
      suggestForAlignmentUserIds: {$exists:true, $ne: []},
      reviewForAlignmentUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      }
    }
  }
})
