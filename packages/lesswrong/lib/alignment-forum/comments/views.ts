import { Comments } from "../../collections/comments";
import { viewFieldNullOrMissing } from "@/lib/utils/viewConstants";

Comments.addView("alignmentSuggestedComments", function (terms) {
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
