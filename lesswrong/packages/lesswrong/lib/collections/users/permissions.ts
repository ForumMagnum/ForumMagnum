import Users from '../users/collection'
import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import { sunshineRegimentGroup } from '../../permissions';

const sunshineRegimentActions = [
  'users.edit.all',
  'users.view.deleted'
];
sunshineRegimentGroup.can(sunshineRegimentActions);

Users.checkAccess = async (user: DbUser|null, document: DbUser, context: ResolverContext|null): Promise<boolean> => {
  if (document && document.deleted && !userOwns(user, document)) return userCanDo(user, 'users.view.deleted')
  return true
};
