import { adminsGroup, membersGroup } from '../../vulcan-users/permissions';

const membersActions = [
  'usermostvaluableposts.view.own',
  'usermostvaluableposts.new',
  'usermostvaluableposts.edit.own',
  'usermostvaluableposts.remove.own',
];
membersGroup.can(membersActions);

const adminActions = [
  'usermostvaluableposts.edit.all',
  'usermostvaluableposts.remove.all'
];
adminsGroup.can(adminActions);
