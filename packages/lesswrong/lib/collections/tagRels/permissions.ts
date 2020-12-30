import { membersGroup } from '../../vulcan-users/permissions';

const votingActions = [
  'tagrels.smallDownvote',
  'tagrels.bigDownvote',
  'tagrels.smallUpvote',
  'tagrels.bigUpvote',
]

membersGroup.can(votingActions);
