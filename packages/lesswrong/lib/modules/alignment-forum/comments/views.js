import { Comments } from "../../../collections/comments";

Comments.addView("alignmentSuggestedComments", function () {
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
