import { sunshineRegimentGroup } from '../../permissions';
import { userCanDo, membersGroup, adminsGroup } from '../../vulcan-users/permissions';
import Conversations from './collection'

const membersActions = [
  'conversations.new.own',
  'conversations.edit.own',
  'conversations.remove.own',
  'conversations.view.own',
];
membersGroup.can(membersActions);

const adminActions = [
  'conversations.new.all',
  'conversations.edit.all',
  'conversations.remove.all',
  'conversations.view.all',
];
adminsGroup.can(adminActions);

const sunshineRegimentActions = [
  'conversations.view.all'
];
sunshineRegimentGroup.can(sunshineRegimentActions);

Conversations.checkAccess = async (user: DbUser|null, document: DbConversation, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return document.participantIds?.includes(user._id) ? userCanDo(user, 'conversations.view.own') : userCanDo(user, `conversations.view.all`)
};
