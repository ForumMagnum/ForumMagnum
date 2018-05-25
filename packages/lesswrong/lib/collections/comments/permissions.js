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
  'comments.cancelSmallDownvote',
  'comments.cancelBigDownvote',
  'comments.smallUpvote',
  'comments.bigUpvote',
  'comments.cancelSmallUpvote',
  'comments.cancelBigUpvote',
]

Users.groups.members.can(votingActions);
