import moment from "moment";
import { Posts } from "../../server/collections/posts/collection";
import { addOrUpvoteTag } from "../tagging/tagsGraphQL";
import Tags from "../../server/collections/tags/collection";
import Users from "../../server/collections/users/collection";
import { createAdminContext } from "../vulcan-lib/query";
import { createMutator } from "../vulcan-lib/mutators";

// Exported to allow running manually with "yarn repl"
export async function bestOfLessWrongTagUpdate () {
  const tag = await Tags.findOne({slug: "best-of-lesswrong"});
  const user = await Users.findOne({displayName: "Raemon"});
  const context = createAdminContext();

  if (tag && user && context) {
    const posts = await Posts.find({
      finalReviewVoteScoreHighKarma: {$gt: 20},
      [`tagRelevance.${tag._id}`]: {$exists: false}
    }, {sort: {postedAt: -1}}).fetch();

    // eslint-disable-next-line no-console
    console.log(`${posts.length} posts to add to Best of LessWrong tag`)
    
    posts.forEach((post, i) => {
      // eslint-disable-next-line no-console
      console.log(i, post.title, moment(post.postedAt).format("YYYY-MM-DD"))
    })
    await Promise.all(posts.map((post) => addOrUpvoteTag({tagId: tag._id, postId:post._id, currentUser: user, context})))
  }
}

