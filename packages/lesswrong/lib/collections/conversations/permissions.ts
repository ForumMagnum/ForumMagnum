import { userCanDo } from '../../vulcan-users/permissions';
import Conversations from './collection'

Conversations.checkAccess = async (user: DbUser|null, document: DbConversation, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return document.participantIds?.includes(user._id) ? userCanDo(user, 'conversations.view.own') : userCanDo(user, `conversations.view.all`)
};
