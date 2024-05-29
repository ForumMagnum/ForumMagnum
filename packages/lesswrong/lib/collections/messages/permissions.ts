import { userCanDo } from '../../vulcan-users/permissions';
import Messages from './collection';
import Conversations from '../conversations/collection'

Messages.checkAccess = async (user: DbUser|null, document: DbMessage, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (await Conversations.findOne({_id: document.conversationId}))?.participantIds?.includes(user._id) ?
    userCanDo(user, 'messages.view.own') : userCanDo(user, `messages.view.all`)
};
