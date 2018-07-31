import Users from 'meteor/vulcan:users';
import { Comments, Posts } from "meteor/example-forum";
import { getSetting } from 'meteor/vulcan:core';

Comments.checkAccess = (currentUser, comment) => {
  if (Users.isAdmin(currentUser)) {
    return true
  }
  if (getSetting('AlignmentForum', false)) {
    if (!Users.canDo(currentUser, 'comments.alignment.new')) {
      const post = Posts.findOne({_id:comment.postId})
      return Users.owns(currentUser, post) && Users.owns(currentUser, comment)
    }
  }
  if (Users.owns(currentUser, comment)) {
    return true
  } else if (comment.isDeleted) {
    return false;
  } else {
    return true;
  }
}

const sunshineRegimentActions = [
  'comments.softRemove.all',
  'comments.replyOnBlocked.all',
  'comments.edit.all'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);

const votingActions = [
  'comments.smallDownvote',
  'comments.bigDownvote',
  'comments.smallUpvote',
  'comments.bigUpvote',
]

Users.groups.members.can(votingActions);
