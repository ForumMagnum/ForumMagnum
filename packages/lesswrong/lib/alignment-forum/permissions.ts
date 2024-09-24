import { createGroup } from '../vulcan-users/permissions';

const alignmentVotersGroup = createGroup("alignmentVoters", [
  'votes.alignment',
]);
const alignmentForumGroup = createGroup("alignmentForum", [
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.move',
  'posts.alignment.suggest',
  'comments.alignment.new',
  'comments.alignment.move.all',
  'comments.alignment.suggest',
]);
const alignmentForumAdminsGroup = createGroup("alignmentForumAdmins", [
  'posts.alignment.move.all',
  'alignment.sidebar',
]);
