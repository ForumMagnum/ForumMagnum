import moment from "moment";
import { Posts } from "../../lib/collections/posts";
import { Globals, createAdminContext, createMutator } from "../vulcan-lib";
import { addOrUpvoteTag } from "../tagging/tagsGraphQL";
import Tags from "../../lib/collections/tags/collection";
import Users from "../../lib/collections/users/collection";

async function bestOfLessWrongTagUpdate () {
  const posts = await Posts.find({
    finalReviewVoteScoreHighKarma: {$gt: 20},
  }, {sort: {postedAt: -1}}).fetch();

  const tag = await Tags.findOne({slug: "best-of-lesswrong"});
  const user = await Users.findOne({displayName: "Raemon"});
  const context = createAdminContext();

  if (tag && user && context) {
    for (let i = 0; i < posts.length; i++) {
      void addOrUpvoteTag({tagId: tag?._id, postId:posts[i]._id, currentUser: user, context});
    }
  }
}

Globals.bestOfLessWrongTagUpdate = bestOfLessWrongTagUpdate;