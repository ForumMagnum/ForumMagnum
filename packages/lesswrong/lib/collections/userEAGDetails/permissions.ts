import { membersGroup } from '../../vulcan-users/permissions';

const membersActions = [
  'usereagdetails.view.own',
  'usereagdetails.new',
  'usereagdetails.edit.own',
];
membersGroup.can(membersActions);
