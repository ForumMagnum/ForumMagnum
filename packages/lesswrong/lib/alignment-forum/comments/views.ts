import { Comments } from "../../collections/comments";
import { ensureIndex } from '../../collectionIndexUtils';
import { augmentForDefaultView } from '../../collections/comments/views';
import { viewFieldNullOrMissing } from "../../vulcan-lib";

Comments.addView("alignmentSuggestedComments", function (terms: OldCommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      af: false,
      suggestForAlignmentUserIds: {$exists:true, $ne: []},
      reviewForAlignmentUserId: viewFieldNullOrMissing
    },
    options: {
      sort: {
        postedAt: 1,
      }, 
      hint: "comments.alignmentSuggestedComments",
    }
  }
})
ensureIndex(Comments,
  augmentForDefaultView({ reviewForAlignmentUserId:1, af:1, suggestForAlignmentUserIds:1, postedAt:1, }),
  {
    name: "comments.alignmentSuggestedComments",
    partialFilterExpression: { "suggestForAlignmentUserIds.0": {$exists:true} },
  }
);
