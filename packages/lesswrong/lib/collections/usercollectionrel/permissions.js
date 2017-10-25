import Users from 'meteor/vulcan:users';
import UserCollectionRels from './collection.js';

const membersActions = [
  'usercollectionrels.new.own',
  'usercollectionrels.edit.own',
  'usercollectionrels.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'usercollectionrels.new.all',
  'usercollectionrels.edit.all',
  'usercollectionrels.remove.all',
];
Users.groups.admins.can(adminActions);

UserCollectionRels.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return Users.owns(user, document) ? Users.canDo(user, 'notifications.view.own') : Users.canDo(user, `conversations.view.all`)
    };
