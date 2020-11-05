import { userGroups, createGroup } from '../vulcan-users/permissions';

createGroup("alignmentVoters");
createGroup("alignmentForum");
createGroup("alignmentForumAdmins");

const alignmentVotersActions = [
  'votes.alignment',
]

userGroups.alignmentVoters.can(alignmentVotersActions);

const alignmentForumActions = [
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.move',
  'posts.alignment.suggest',
  'comments.alignment.new',
  'comments.alignment.move.all',
  'comments.alignment.suggest',
]

userGroups.alignmentForum.can(alignmentForumActions);

const alignmentForumAdminsActions = [
  'posts.alignment.move.all',
  'alignment.sidebar',
]

userGroups.alignmentForumAdmins.can(alignmentForumAdminsActions);
