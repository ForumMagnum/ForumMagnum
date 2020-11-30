import { userCanDo, userGroups } from '../../vulcan-users/permissions';
import Conversations from './collection'

const membersActions = [
  'conversations.new.own',
  'conversations.edit.own',
  'conversations.remove.own',
  'conversations.view.own',
];
userGroups.members.can(membersActions);

const adminActions = [
  'conversations.new.all',
  'conversations.edit.all',
  'conversations.remove.all',
  'conversations.view.all',
];
userGroups.admins.can(adminActions);

Conversations.checkAccess = async (user: DbUser|null, document: DbConversation, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.view.own') : userCanDo(user, `conversations.view.all`)
};
