import { Posts } from '../../../collections/posts';
import { ensureIndex } from '../../../collectionUtils';
import { augmentForDefaultView } from '../../../collections/posts/views';

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
ensureIndex(Posts,
  augmentForDefaultView({ af:1, suggestForAlignmentUserIds:1, reviewForAlignmentUserId:1, createdAt:1 }),
  { name: "posts.alignmentSuggestedPosts" }
);