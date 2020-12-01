import Users from '../users/collection'
import { userCanDo, userGroups } from '../../vulcan-users/permissions';

const sunshineRegimentActions = [
  'users.edit.all',
  'users.view.deleted'
];
userGroups.sunshineRegiment.can(sunshineRegimentActions);

Users.checkAccess = async (user: DbUser|null, document: DbUser, context: ResolverContext|null): Promise<boolean> => {
  if (document && document.deleted) return userCanDo(user, 'users.view.deleted')
  return true
};
