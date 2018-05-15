/*

Comments permissions

*/

import Users from 'meteor/vulcan:users';

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
  'comments.smallUpvote',
  'comments.bigUpvote',
  'comments.cancelUpvote',
  'comments.cancelSmallUpvote',
  'comments.cancelBigUpvote',
  'comments.downvote',
  'comments.smallDownvote',
  'comments.bigDownvote',
  'comments.cancelDownvote',
  'comments.cancelSmallDownvote',
  'comments.cancelBigDownvote',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'comments.edit.all',
  'comments.remove.all'
];
Users.groups.admins.can(adminActions);
