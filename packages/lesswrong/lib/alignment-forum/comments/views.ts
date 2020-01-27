import { Comments } from "../../collections/comments";
import { ensureIndex } from '../../collectionUtils';
import { augmentForDefaultView } from '../../collections/comments/views';

Comments.addView("alignmentSuggestedComments", function () {
  return {
    selector: {
      af: false,
      suggestForAlignmentUserIds: {$exists:true, $ne: []},
      reviewForAlignmentUserId: {$exists:false}
    },
    options: {
      sort: {
        createdAt: 1,
      },
      hint: "comments.alignmentSuggestedComments",
    }
  }
})
ensureIndex(Comments,
  augmentForDefaultView({ reviewForAlignmentUserId:1, af:1, suggestForAlignmentUserIds:1, createdAt:1, }),
  {
    name: "comments.alignmentSuggestedComments",
    partialFilterExpression: { "suggestForAlignmentUserIds.0": {$exists:true} },
  }
);
