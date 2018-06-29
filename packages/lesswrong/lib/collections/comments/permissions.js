import Users from 'meteor/vulcan:users';

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
