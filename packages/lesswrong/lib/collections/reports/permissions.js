import Users from 'meteor/vulcan:users';
import Reports from './collection.js';
import Conversations from '../conversations/collection.js'

const membersActions = [
  'reports.new.own',
  'reports.view.own',
];
Users.groups.members.can(membersActions);

const sunshineRegimentActions = [
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);

Reports.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? Users.canDo(user, 'reports.view.own') : Users.canDo(user, `reports.view.all`)
  )
};
