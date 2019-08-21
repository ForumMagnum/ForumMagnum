import Users from "meteor/vulcan:users";
import { addCallback } from 'meteor/vulcan:core';

async function PostsMoveToAFAddsAlignmentVoting (post, oldPost) {
  if (post.af && !oldPost.af) {
    Users.update({_id:post.userId}, {$addToSet: {groups: 'alignmentVoters'}})
  }
}

addCallback("posts.alignment.async", PostsMoveToAFAddsAlignmentVoting);
