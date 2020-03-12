import Users from '../users/collection'

const votingActions = [
  'tagrels.smallDownvote',
  'tagrels.bigDownvote',
  'tagrels.smallUpvote',
  'tagrels.bigUpvote',
]

Users.groups.members.can(votingActions);
