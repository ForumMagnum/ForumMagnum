import Users from "meteor/vulcan:users";
import { addCallback } from 'meteor/vulcan:core';
import { Posts } from "meteor/example-forum";

async function PostsMoveToAFAddsAlignmentVoting (post, oldPost) {
  if (post.af && !oldPost.af) {
    Users.update({_id:post.userId}, {$addToSet: {groups: 'alignmentVoters'}})
  }
}

addCallback("posts.alignment.async", PostsMoveToAFAddsAlignmentVoting);

async function PostsMoveToAFUpdatesAFPostCount (post, oldPost) {
  if (!oldPost || (post.af !== oldPost.af)) {
    const afPostCount = Posts.find({userId:post.userId, af: true, draft: false}).count()
    Users.update({_id:post.userId}, {$set: {afPostCount: afPostCount}})
  }
}

addCallback("posts.alignment.async", PostsMoveToAFUpdatesAFPostCount);
addCallback("posts.edit.async", PostsMoveToAFUpdatesAFPostCount);
addCallback("posts.new.async", PostsMoveToAFUpdatesAFPostCount);
