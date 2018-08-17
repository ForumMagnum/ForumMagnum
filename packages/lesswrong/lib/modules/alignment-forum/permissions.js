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
  'posts.alignment.move',
  'comments.alignment.new',
  'comments.alignment.move.all'
]

Users.groups.alignmentForum.can(alignmentForumActions);

const alignmentForumAdminsActions = [
  'posts.alignment.move.all',
]

Users.groups.alignmentForumAdmins.can(alignmentForumAdminsActions);
