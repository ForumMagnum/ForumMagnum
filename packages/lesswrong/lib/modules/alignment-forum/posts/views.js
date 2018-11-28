import { Posts } from '../../../collections/posts';

Posts.addView("alignmentSuggestedPosts", function () {
  return {
    selector: {
      af: {$in: [false,null]},
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
