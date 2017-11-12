import Users from 'meteor/vulcan:users';
import UserSequenceRels from './collection.js';

const membersActions = [
  'usersequencerels.new.own',
  'usersequencerels.edit.own',
  'usersequencerels.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'usersequencerels.new.all',
  'usersequencerels.edit.all',
  'usersequencerels.remove.all',
];
Users.groups.admins.can(adminActions);

UserSequenceRels.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return Users.owns(user, document) ? Users.canDo(user, 'notifications.view.own') : Users.canDo(user, `conversations.view.all`)
    };
