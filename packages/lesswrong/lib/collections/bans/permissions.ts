import { userCanDo } from '../../vulcan-users/permissions';
import { Bans } from './collection';

Bans.checkAccess = async (user: DbUser|null, document: DbBan, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userCanDo(user, 'bans.view')
};
