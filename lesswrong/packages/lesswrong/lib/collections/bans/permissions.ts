import { membersGroup, adminsGroup, userCanDo } from '../../vulcan-users/permissions';
import { Bans } from './collection';

const membersActions = [
  'bans.view',
];
membersGroup.can(membersActions);

const adminActions = [
  'bans.new',
  'bans.edit.all',
  'bans.remove.all',
  'bans.view.all',
  'bans.remove',
  'bans.edit',
];
adminsGroup.can(adminActions);

Bans.checkAccess = async (user: DbUser|null, document: DbBan, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userCanDo(user, 'bans.view')
};
