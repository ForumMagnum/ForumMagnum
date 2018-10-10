import { Comments } from './collection'
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

/*

Example-forum permissions

*/

const membersActions = [
  'comments.view',
  'comments.new',
  'comments.edit.own',
  'comments.remove.own',
  'comments.upvote',
  'comments.cancelUpvote',
  'comments.downvote',
  'comments.cancelDownvote'
];
Users.groups.members.can(membersActions);

const adminActions = [
  'comments.edit.all',
  'comments.remove.all'
];
Users.groups.admins.can(adminActions);

// LessWrong permissions

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
