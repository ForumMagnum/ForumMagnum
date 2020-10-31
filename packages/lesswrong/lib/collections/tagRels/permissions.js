import { userGroups } from '../../vulcan-users/permissions';

const votingActions = [
  'tagrels.smallDownvote',
  'tagrels.bigDownvote',
  'tagrels.smallUpvote',
  'tagrels.bigUpvote',
]

userGroups.members.can(votingActions);
