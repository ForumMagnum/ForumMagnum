import { createGroup } from '../vulcan-users/permissions';

const alignmentVotersGroup = createGroup("alignmentVoters");
const alignmentForumGroup = createGroup("alignmentForum");
const alignmentForumAdminsGroup = createGroup("alignmentForumAdmins");

const alignmentVotersActions = [
  'votes.alignment',
]

alignmentVotersGroup.can(alignmentVotersActions);

const alignmentForumActions = [
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.move',
  'posts.alignment.suggest',
  'comments.alignment.new',
  'comments.alignment.move.all',
  'comments.alignment.suggest',
]

alignmentForumGroup.can(alignmentForumActions);

const alignmentForumAdminsActions = [
  'posts.alignment.move.all',
  'alignment.sidebar',
]

alignmentForumAdminsGroup.can(alignmentForumAdminsActions);
