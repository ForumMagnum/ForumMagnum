import Users from 'meteor/vulcan:users'

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
  'posts.alignment.edit',
  'comments.alignment.new'
]

Users.groups.alignmentForum.can(alignmentForumActions);

const alignmentForumAdminsActions = [
  'votes.alignment',
  'posts.alignment.edit.all',
  'comments.alignment.edit.all'
]

Users.groups.alignmentForumAdmins.can(alignmentForumAdminsActions);
