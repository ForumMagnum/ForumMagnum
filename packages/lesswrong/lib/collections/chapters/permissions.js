import Users from 'meteor/vulcan:users';

const membersActions = [
  "chapters.view.own",
  "chapters.new.own",
  "chapters.edit.own",
  "chapters.remove.own",
];
Users.groups.members.can(membersActions);

const adminActions = [
  "chapters.view.all",
  "chapters.new.all",
  "chapters.edit.all",
  "chapters.remove.all",
];
Users.groups.admins.can(adminActions);
