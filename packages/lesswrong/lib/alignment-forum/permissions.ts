import Users from '../collections/users/collection'

Users.createGroup("alignmentVoters");
Users.createGroup("alignmentForum");
Users.createGroup("alignmentForumAdmins");

const alignmentVotersActions = [
  'votes.alignment',
]

Users.groups.alignmentVoters.can(alignmentVotersActions);

const alignmentForumActions = [
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.move',
  'posts.alignment.suggest',
  'comments.alignment.new',
  'comments.alignment.move.all',
  'comments.alignment.suggest',
]

Users.groups.alignmentForum.can(alignmentForumActions);

const alignmentForumAdminsActions = [
  'posts.alignment.move.all',
  'alignment.sidebar',
]

Users.groups.alignmentForumAdmins.can(alignmentForumAdminsActions);
