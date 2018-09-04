import { Comments } from 'meteor/example-forum'
import Users from 'meteor/vulcan:users';

// TODO: IBETA ONLY Only logged-in users can see forum posts
Comments.checkAccess = (currentUser, comment) => {
  if (!currentUser) {
    return false;
  }
  if (Users.isAdmin(currentUser)) {
    return true
  } else if (Users.owns(currentUser, comment) || Users.isSharedOn(currentUser, comment)) {
    return true;
  }
  if (comment.isFuture || comment.draft) {
    return false;
  }
  return true
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
