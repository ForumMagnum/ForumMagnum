import Users from '../users/collection';
import Messages from './collection';
import Conversations from '../conversations/collection'

const membersActions = [
  'messages.new.own',
  'messages.edit.own',
  'messages.remove.own',
  'messages.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'messages.new.all',
  'messages.edit.all',
  'messages.remove.all',
  'messages.view.all',
];
Users.groups.admins.can(adminActions);

Messages.checkAccess = async (user: DbUser|null, document: DbMessage, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return Conversations.findOne({_id: document.conversationId})?.participantIds?.includes(user._id) ?
    Users.canDo(user, 'messages.view.own') : Users.canDo(user, `messages.view.all`)
};
