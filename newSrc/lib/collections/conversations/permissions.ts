import Users from '../users/collection';
import Conversations from './collection'

const membersActions = [
  'conversations.new.own',
  'conversations.edit.own',
  'conversations.remove.own',
  'conversations.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'conversations.new.all',
  'conversations.edit.all',
  'conversations.remove.all',
  'conversations.view.all',
];
Users.groups.admins.can(adminActions);

Conversations.checkAccess = async (user: DbUser|null, document: DbConversation, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.view.own') : Users.canDo(user, `conversations.view.all`)
};
