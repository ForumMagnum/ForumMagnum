import Users from 'meteor/vulcan:users'

Users.createGroup("alignmentForum");
Users.createGroup("alignmentForumAdmins");

const alignmentForumActions = [
  'votes.alignment',
  'posts.alignment.new',
  'posts.alignment.edit',
  'comments.alignment.new'
]

Users.groups.alignmentForumAdmins.can(alignmentForumActions);

const alignmentForumAdminsActions = [
  'votes.alignment',
  'posts.alignment.edit.all',
  'comments.alignment.edit.all'
]

Users.groups.alignmentForumAdmins.can(alignmentForumAdminsActions);
