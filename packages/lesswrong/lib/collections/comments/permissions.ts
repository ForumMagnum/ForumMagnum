import { guestsGroup, membersGroup, adminsGroup } from '../../vulcan-users/permissions';
import { sunshineRegimentGroup } from '../../permissions';

const guestsActions = [
  'comments.view'
];
guestsGroup.can(guestsActions);

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
membersGroup.can(membersActions);

const adminActions = [
  'comments.edit.all',
  'comments.remove.all'
];
adminsGroup.can(adminActions);

// LessWrong permissions

const sunshineRegimentActions = [
  'comments.softRemove.all',
  'comments.replyOnBlocked.all',
  'comments.edit.all'
];
sunshineRegimentGroup.can(sunshineRegimentActions);

const votingActions = [
  'comments.smallDownvote',
  'comments.bigDownvote',
  'comments.smallUpvote',
  'comments.bigUpvote',
]

membersGroup.can(votingActions);
