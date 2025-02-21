import { Posts } from '../../collections/posts';
import { viewFieldNullOrMissing } from '@/lib/utils/viewConstants';

Posts.addView("alignmentSuggestedPosts", function () {
  return {
    selector: {
      af: false,
      suggestForAlignmentUserIds: {$exists:true, $ne: []},
      reviewForAlignmentUserId: viewFieldNullOrMissing
    },
    options: {
      sort: {
        createdAt: 1,
      },
      hint: "posts.alignmentSuggestedPosts",
    }
  }
})
