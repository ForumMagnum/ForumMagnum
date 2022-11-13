import { Posts } from '../../collections/posts';
import { ensureIndex } from '../../collectionIndexUtils';
import { augmentForDefaultView } from '../../collections/posts/views';
import {viewFieldNullOrMissing} from "../../vulcan-lib";

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
ensureIndex(Posts,
  augmentForDefaultView({ reviewForAlignmentUserId:1, af:1, suggestForAlignmentUserIds:1, createdAt:1, }),
  {
    name: "posts.alignmentSuggestedPosts",
    partialFilterExpression: { "suggestForAlignmentUserIds.0": {$exists:true} },
  }
);
