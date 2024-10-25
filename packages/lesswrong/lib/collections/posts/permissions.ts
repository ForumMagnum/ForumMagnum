import { Posts } from './collection'
import { guestsGroup, membersGroup, adminsGroup } from '../../vulcan-users/permissions';
import { sunshineRegimentGroup, trustLevel1Group, canModeratePersonalGroup, canCommentLockGroup } from '../../permissions';
import { postCheckAccess } from './checkAccess';

const guestsActions = [
  'posts.view.approved'
];
guestsGroup.can(guestsActions);

const membersActions = [
  'posts.new',
  'posts.edit.own',
  'posts.remove.own',
  'posts.upvote',
  'posts.downvote',
];
membersGroup.can(membersActions);

const adminActions = [
  'posts.view.all',
  'posts.view.pending',
  'posts.view.rejected',
  'posts.view.spam',
  'posts.view.deleted',
  'posts.new.approved',
  'posts.edit.all',
  'posts.remove.all'
];
adminsGroup.can(adminActions);

// LessWrong Permissions

Posts.checkAccess = postCheckAccess;

const votingActions = [
  'posts.smallDownvote',
  'posts.bigDownvote',
  'posts.smallUpvote',
  'posts.bigUpvote',
]

membersGroup.can(votingActions);

const sunshineRegimentActions = [
  'posts.view.all',
  'posts.edit.all',
  'posts.curate.all',
  'posts.suggestCurate',
  'posts.frontpage.all',
  'posts.moderate.all',
  'posts.commentLock.all'
];
sunshineRegimentGroup.can(sunshineRegimentActions);


trustLevel1Group.can(['posts.moderate.own', 'posts.suggestCurate']);
canModeratePersonalGroup.can(['posts.moderate.own.personal']);
canCommentLockGroup.can(['posts.commentLock.own']);
