import Users from "../../../lib/collections/users/collection";
import { postsAlignmentAsync } from '../../resolvers/alignmentForumMutations';

async function PostsMoveToAFAddsAlignmentVoting (post: DbPost, oldPost: DbPost) {
  if (post.af && !oldPost.af) {
    await Users.rawUpdateOne({_id:post.userId}, {$addToSet: {groups: 'alignmentVoters'}})
  }
}

postsAlignmentAsync.add(PostsMoveToAFAddsAlignmentVoting);
