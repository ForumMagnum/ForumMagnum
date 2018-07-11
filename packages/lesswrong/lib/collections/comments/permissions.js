import Users from 'meteor/vulcan:users';

// TODO: IBETA ONLY Only logged-in users can see forum posts
Users.groups.guests.cannot('comments.view')

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
