import Users from '../users/collection';


/*

Example-forum permissions

*/

const guestsActions = [
  'comments.view'
];
Users.groups.guests.can(guestsActions);

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
