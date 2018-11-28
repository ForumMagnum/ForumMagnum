import { Comments } from "../../../collections/comments";
import { ensureIndex } from '../../../collectionUtils';
import { augmentForDefaultView } from '../../../collections/comments/views';

Comments.addView("alignmentSuggestedComments", function () {
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
ensureIndex(Comments,
  augmentForDefaultView({ af:1, suggestForAlignmentUserIds:1, reviewForAlignmentUserId:1, createdAt:1 }),
  { name: "comments.alignmentSuggestedComments" }
);
