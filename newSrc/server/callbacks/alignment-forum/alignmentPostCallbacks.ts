import Users from "../../../lib/collections/users/collection";
import { addCallback } from '../../vulcan-lib';

async function PostsMoveToAFAddsAlignmentVoting (post: DbPost, oldPost: DbPost) {
  if (post.af && !oldPost.af) {
    Users.update({_id:post.userId}, {$addToSet: {groups: 'alignmentVoters'}})
  }
}

addCallback("posts.alignment.async", PostsMoveToAFAddsAlignmentVoting);
