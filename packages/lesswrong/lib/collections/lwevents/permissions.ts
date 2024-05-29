import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import LWevents from './collection';


LWevents.checkAccess = async (user: DbUser|null, document: DbLWEvent, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  if (document.name === "gatherTownUsersCheck") return true
  return userOwns(user, document) ? userCanDo(user, 'events.view.own') : userCanDo(user, `events.view.all`)
};
