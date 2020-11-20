import { userGroups } from '../../vulcan-users/permissions';

const guestsActions = [
  'comments.view'
];
userGroups.guests.can(guestsActions);

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
userGroups.members.can(membersActions);

const adminActions = [
  'comments.edit.all',
  'comments.remove.all'
];
userGroups.admins.can(adminActions);

// LessWrong permissions

const sunshineRegimentActions = [
  'comments.softRemove.all',
  'comments.replyOnBlocked.all',
  'comments.edit.all'
];
userGroups.sunshineRegiment.can(sunshineRegimentActions);

const votingActions = [
  'comments.smallDownvote',
  'comments.bigDownvote',
  'comments.smallUpvote',
  'comments.bigUpvote',
]

userGroups.members.can(votingActions);
